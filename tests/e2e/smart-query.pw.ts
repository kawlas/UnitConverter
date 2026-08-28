import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const searchName = "Search categories, units, or type a conversion";

test("a typed conversion previews the answer and opens shareable calculator state", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  const search = page.getByRole("combobox", { name: searchName });
  await search.fill("5 ft to cm");

  const smartOption = page.getByRole("option", { name: /Instant answer.*5 ft to cm.*152\.4 cm/i });
  await expect(smartOption).toBeVisible();
  await expect(smartOption).toHaveAttribute("href", "/length?from=feet&to=centimeters&value=5");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/length\?from=feet&to=centimeters&value=5$/);
  await expect(page.getByRole("heading", { name: "Length Converter", exact: true })).toBeVisible();
  await expect(page.locator("#length-result")).toHaveValue("152.4");
  expect(externalRequests).toEqual([]);
});

test("smart conversion is the first keyboard option", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("combobox", { name: searchName });
  await search.fill("100 C in F");
  await page.getByRole("heading", { name: "Convert anything. Just ask." }).click();
  await expect(page.getByRole("option", { name: /Instant answer/i })).toBeHidden();
  await search.focus();
  await expect(page.getByRole("option", { name: /Instant answer/i })).toBeVisible();
  await search.press("ArrowDown");

  await expect(search).toHaveAttribute("aria-activedescendant", "conversion-search-option-smart");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/temperature\?from=celsius&to=fahrenheit&value=100$/);
  await expect(page.locator("#temperature-result")).toHaveValue("212");
});

test("ambiguous or incompatible units get local, actionable feedback", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("combobox", { name: searchName });

  await search.fill("1 KB to B");
  await expect(page.getByRole("status")).toContainText(/capitalization.*5 ft to cm/i);
  await search.press("Enter");
  await expect(page).toHaveURL(/\/$/);

  await search.fill("5 m to kg");
  await expect(page.getByRole("status")).toContainText(/same category/i);
});

test("smart query results remain accessible at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: searchName }).fill("2,5 kilograms into pounds");
  await expect(page.getByRole("option", { name: /Instant answer/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="search"]').analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("human compound height input is interpreted without manual arithmetic", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("combobox", { name: searchName });
  await search.fill("5'11\" in cm");

  const answer = page.getByRole("option", { name: /Instant answer.*5 ft 11 in to cm.*180\.34 cm/i });
  await expect(answer).toBeVisible();
  await search.press("Enter");

  await expect(page).toHaveURL(/\/length\?from=inches&to=centimeters&value=71$/);
  await expect(page.locator("#length-result")).toHaveValue("180.34");
});

test("example questions expose common weight, area, and fuel intents", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const examples = page.getByLabel("Example conversions");
  await expect(examples.getByRole("button", { name: "10 kg to g" })).toBeVisible();
  await expect(examples.getByRole("button", { name: "5 ha to m²" })).toBeVisible();
  await expect(examples.getByRole("button", { name: "7 L/100km to mpg" })).toBeVisible();

  await examples.getByRole("button", { name: "7 L/100km to mpg" }).click();
  await expect(page.getByRole("option", { name: /Instant answer.*7 L\/100 km to mpg.*33\.602/i })).toBeVisible();
});
