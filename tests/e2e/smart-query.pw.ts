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

  const smartOption = page.getByRole("option", { name: /Quick conversion.*5 ft to cm.*152\.4 cm/i });
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
  await page.getByRole("heading", { name: "Make every measurement make sense." }).click();
  await expect(page.getByRole("option", { name: /Quick conversion/i })).toBeHidden();
  await search.focus();
  await expect(page.getByRole("option", { name: /Quick conversion/i })).toBeVisible();
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
  await expect(page.getByRole("option", { name: /Quick conversion/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="search"]').analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
