import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 320, height: 568 },
] as const;

const routes = ["/", "/length"] as const;

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(dimensions.document, `document scrollWidth ${dimensions.document} exceeds viewport ${dimensions.viewport}`).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body, `body scrollWidth ${dimensions.body} exceeds viewport ${dimensions.viewport}`).toBeLessThanOrEqual(dimensions.viewport);
}

test("length converter loads a styled UI and its CSS asset", async ({ page, request }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Length Converter", exact: true })).toBeVisible();
  await expect(page.locator("h1")).toHaveClass(/text-4xl/);
  await expect(page.locator("h1")).toHaveClass(/font-bold/);

  const stylesheet = page.locator('link[rel="stylesheet"]').first();
  await expect(stylesheet).toHaveAttribute("href", /.+/);
  const href = await stylesheet.getAttribute("href");
  const cssResponse = await request.get(new URL(href!, page.url()).toString());
  expect(cssResponse.ok()).toBeTruthy();
});

test("canonical routes ship meaningful HTML before JavaScript runs", async ({ request }) => {
  const homeHtml = await (await request.get("/")).text();
  const lengthHtml = await (await request.get("/length")).text();

  expect(homeHtml).toContain("<h1");
  expect(homeHtml).toContain("Make every measurement make sense.");
  expect(homeHtml).toContain('rel="canonical" href="https://qconverter.netlify.app/"');
  expect(homeHtml).toContain('property="og:image" content="https://qconverter.netlify.app/og-q-converter.png"');
  expect(lengthHtml).toContain("<h1");
  expect(lengthHtml).toContain("Length Converter");
  expect(lengthHtml).toContain('rel="canonical" href="https://qconverter.netlify.app/length"');
  expect(lengthHtml).toContain('type="application/ld+json"');
  expect(lengthHtml).toContain('name="twitter:card" content="summary_large_image"');
  expect(lengthHtml).toContain("Sources &amp; methodology");
  expect(lengthHtml).toContain("https://www.bipm.org/en/publications/si-brochure");
});

test("unknown routes return a real noindex 404", async ({ request }) => {
  const response = await request.get("/does-not-exist", { maxRedirects: 0 });

  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('name="robots" content="noindex, follow"');
});

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${viewport.name} ${route} has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await assertNoHorizontalOverflow(page);
    });
  }
}

test("length converter has a non-empty, correct document title", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  const title = await page.title();
  expect(title.trim()).not.toBe("");
  await expect(page).toHaveTitle("Length Converter — Free Online Q Converter");
});

test("URL-state conversion shows 0.62 and swap updates the result and URL", async ({ page }) => {
  await page.goto("/length?from=kilometers&to=miles&value=1", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#length-result")).toHaveValue("0.62");
  const initialUrl = new URL(page.url());
  expect(initialUrl.searchParams.get("from")).toBe("kilometers");
  expect(initialUrl.searchParams.get("to")).toBe("miles");
  expect(initialUrl.searchParams.get("value")).toBe("1");

  await page.getByRole("button", { name: "Swap units" }).click();
  await expect(page.locator("#length-result")).toHaveValue("1");
  await expect.poll(() => {
    const url = new URL(page.url());
    return `${url.searchParams.get("from")}→${url.searchParams.get("to")}`;
  }).toBe("miles→kilometers");
  expect(new URL(page.url()).searchParams.get("value")).not.toBe("1");
});

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${viewport.name} ${route} has no serious or critical accessibility violations`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page }).analyze();
      const blockingViolations = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
      expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    });
  }
}

test("convert alias loads and advertises the short canonical path", async ({ page }) => {
  await page.goto("/convert/length", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Length Converter", exact: true })).toBeVisible();
  const canonical = page.locator('link[rel="canonical"]');
  await expect(page).toHaveURL(/\/length$/);
  await expect(page.locator("title")).toHaveCount(1);
  await expect(canonical).toHaveAttribute("href", "https://qconverter.netlify.app/length");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(3);
});

test("convert alias is a real permanent redirect that preserves query state", async ({ request }) => {
  const response = await request.get("/convert/length?value=12", { maxRedirects: 0 });

  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/length?value=12");
});

test("trailing slash redirects to the no-slash canonical URL", async ({ request }) => {
  const response = await request.get("/length/?value=12", { maxRedirects: 0 });

  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/length?value=12");
});

test("saved conversion controls are available", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await expect(page.getByText("Favorites (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear saved data" })).toBeVisible();
});

test("search combobox supports keyboard selection", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const search = page.getByRole("combobox", {
    name: "Search categories, units, or type a conversion",
  });
  await search.fill("length");
  await expect(search).toHaveAttribute("aria-expanded", "true");

  await search.press("ArrowDown");
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    "conversion-search-option-length",
  );
  const option = page.getByRole("option", { name: /Length/ });
  await expect(option).toHaveAttribute("href", "/length");
  await expect(option).toHaveAttribute("tabindex", "-1");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/length$/);
  await expect(
    page.getByRole("heading", { name: "Length Converter", exact: true }),
  ).toBeVisible();
});

test("history starts after user input and ignores preference-only changes", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(650);

  const readHistory = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("q-converter:history:v1") ?? "[]"),
    );
  await expect.poll(readHistory).toEqual([]);

  await page.getByLabel("From").fill("12");
  await expect.poll(readHistory).toHaveLength(1);

  const originalHistory = await readHistory();
  await page.getByLabel("Decimal precision").selectOption("4");
  await page.waitForTimeout(650);
  await expect.poll(readHistory).toEqual(originalHistory);
});

test("pending history intent cannot leak into another category", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });
  await page.getByLabel("From").fill("99");
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Weight", exact: true }).click();
  await expect(page).toHaveURL(/\/weight$/);
  await page.waitForTimeout(650);

  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("q-converter:history:v1") ?? "[]"),
  );
  expect(history.some((entry: { categoryId: string }) => entry.categoryId === "weight")).toBe(false);
});

test("prerendered pages hydrate cleanly with query and saved browser state", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|did not match/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/hydrat|did not match/i.test(error.message)) hydrationErrors.push(error.message);
  });
  await page.addInitScript(() => {
    localStorage.setItem("q-converter:favorites:v1", JSON.stringify([
      { id: "length:meters:feet", timestamp: Date.now() },
    ]));
  });

  await page.goto("/length?from=kilometers&to=miles&value=1", { waitUntil: "networkidle" });
  await expect(page.locator("#length-result")).toHaveValue("0.62");
  await expect(page.getByText("Favorites (1)")).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("mobile navigation is keyboard accessible and keeps closed links out of tab order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  const menu = page.locator("#mobile-navigation");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const links = menu.locator("a");

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", "mobile-navigation");
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await expect(links.first()).toHaveAttribute("tabindex", "-1");
  await expect.poll(async () => (await toggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

  await toggle.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAttribute("aria-hidden", "false");
  await expect(links.last()).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  await expect(links.first()).toHaveAttribute("tabindex", "0");
});

test("converter inputs have accessible names and a live result", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("From")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Source unit" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Target unit" })).toBeVisible();
  await expect(page.locator("#length-result")).toHaveAttribute("aria-live", "polite");

  await page.goto("/bmi", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Height", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Height unit" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Weight", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Weight unit" })).toBeVisible();
  await expect(page.locator("[aria-live=polite]").first()).toBeVisible();
});
