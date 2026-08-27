import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
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
  await expect(canonical).toHaveAttribute("href", `${new URL(page.url()).origin}/length`);
});

test("saved conversion controls are available", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await expect(page.getByText("Favorites (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear saved data" })).toBeVisible();
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
