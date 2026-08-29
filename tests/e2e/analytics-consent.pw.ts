import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const consentKey = "q-converter:analytics-consent:v1";
const externalBaseUrl = Boolean(process.env.BASE_URL);

const requireAnalyticsUi = async (page: import("@playwright/test").Page) => {
  const choices = page.getByRole("region", { name: "Analytics privacy choices" });
  if (externalBaseUrl && await choices.count() === 0) {
    test.skip(true, "The analytics release gate is disabled on this deployment.");
  }
  await expect(choices).toBeVisible();
};

test("does not contact Google analytics before consent and remembers decline", async ({ page, request }) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
  });

  await page.goto("/bmi?height=180&weight=80", { waitUntil: "networkidle" });
  const prerenderedHtml = await (await request.get("/bmi?height=180&weight=80")).text();
  expect(prerenderedHtml).not.toContain("googletagmanager.com");
  expect(prerenderedHtml).not.toContain("google-analytics.com");
  const choices = page.getByRole("region", { name: "Analytics privacy choices" });
  if (externalBaseUrl && await choices.count() === 0) {
    expect(analyticsRequests).toEqual([]);
    expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBeNull();
    await page.reload({ waitUntil: "networkidle" });
    expect(analyticsRequests).toEqual([]);
    return;
  }
  await expect(choices).toBeVisible();
  expect(analyticsRequests).toEqual([]);

  await page.getByRole("button", { name: "Use without analytics" }).click();
  await expect(page.getByRole("region", { name: "Analytics privacy choices" })).toBeHidden();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").choice, consentKey)).toBe("declined");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("region", { name: "Analytics privacy choices" })).toBeHidden();
  expect(analyticsRequests).toEqual([]);
});

test("loads GA only after opt-in and sends sanitized SPA page views", async ({ page }) => {
  const analyticsRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    analyticsRequests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  await page.goto("/length?from=meters&to=feet&value=7", { waitUntil: "networkidle" });
  await requireAnalyticsUi(page);
  expect(analyticsRequests).toEqual([]);
  await page.getByRole("textbox", { name: "From", exact: true }).fill("9");
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();

  await page.getByRole("button", { name: "Allow optional analytics" }).click();
  await expect.poll(() => analyticsRequests.length).toBe(1);
  expect(analyticsRequests[0]).toContain("G-DW273J3JPK");

  const firstPageView = await page.evaluate(() =>
    (window.dataLayer ?? []).find((entry) => Array.from(entry)[0] === "event" && Array.from(entry)[1] === "page_view"),
  );
  expect(firstPageView).toBeTruthy();
  const firstParameters = Array.from(firstPageView as unknown[])[2] as Record<string, string>;
  expect(firstParameters.page_location).toBe("http://127.0.0.1:4173/length");
  expect(firstParameters.page_path).toBe("/length");
  expect(JSON.stringify(firstPageView)).not.toContain("value=7");

  await page.getByRole("textbox", { name: "From", exact: true }).fill("12");
  await expect.poll(() => page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .find((entry) => entry[0] === "event" && entry[1] === "conversion_completed"),
  )).toBeTruthy();
  await page.getByRole("button", { name: "Copy result" }).click();
  await expect.poll(() => page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === "event" && entry[1] !== "page_view"),
  )).toEqual(expect.arrayContaining([
    ["event", "conversion_completed", { tool_category: "length" }],
    ["event", "result_copied", { tool_category: "length" }],
  ]));
  const productEvents = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === "event" && entry[1] !== "page_view"),
  );
  expect(JSON.stringify(productEvents)).not.toContain("12");

  await page.getByRole("link", { name: /Weight conversions/i }).click();
  await expect(page).toHaveURL(/\/weight$/);
  const pageViews = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .filter((entry) => Array.from(entry)[0] === "event" && Array.from(entry)[1] === "page_view")
      .map((entry) => Array.from(entry)[2]),
  );
  expect(pageViews[pageViews.length - 1]).toMatchObject({
    page_location: "http://127.0.0.1:4173/weight",
    page_path: "/weight",
    page_title: "Weight Converter — Free Online Q Converter",
  });
});

test("analytics preferences can be reopened and consent revoked", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await requireAnalyticsUi(page);
  await page.getByRole("button", { name: "Allow optional analytics" }).click();

  await page.getByRole("button", { name: "Analytics preferences" }).click();
  await expect(page.getByRole("region", { name: "Analytics privacy choices" })).toBeVisible();
  await page.getByRole("button", { name: "Use without analytics" }).click();

  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").choice, consentKey)).toBe("declined");
  expect(await page.evaluate(() => window["ga-disable-G-DW273J3JPK"])).toBe(true);
});

test("search funnel reports only the selected tool category", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await requireAnalyticsUi(page);
  await page.getByRole("button", { name: "Allow optional analytics" }).click();

  const search = page.getByRole("combobox", {
    name: "Search categories, units, or type a conversion",
  });
  await search.fill("5 ft to cm");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/length\?from=feet&to=centimeters&value=5$/);

  const smartEvent = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .find((entry) => entry[0] === "event" && entry[1] === "smart_query_opened"),
  );
  expect(smartEvent).toEqual(["event", "smart_query_opened", { tool_category: "length" }]);
  expect(JSON.stringify(smartEvent)).not.toContain("5 ft to cm");
  expect(JSON.stringify(smartEvent)).not.toContain("value=5");

  await page.goto("/");
  await page.getByRole("combobox", {
    name: "Search categories, units, or type a conversion",
  }).fill("weight");
  await page.getByRole("combobox", {
    name: "Search categories, units, or type a conversion",
  }).press("Enter");
  await expect(page).toHaveURL(/\/weight$/);

  const categoryEvent = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .find((entry) => entry[0] === "event" && entry[1] === "category_search_opened"),
  );
  expect(categoryEvent).toEqual(["event", "category_search_opened", { tool_category: "weight" }]);
});

test("privacy choices are accessible without overflowing at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await requireAnalyticsUi(page);
  await expect(page.getByRole("region", { name: "Analytics privacy choices" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('[aria-label="Analytics privacy choices"]')
    .analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
