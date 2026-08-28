import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("volume and weight prerendered HTML explain the new unit variants", async ({ request }) => {
  const volumeHtml = await (await request.get("/volume")).text();
  const weightHtml = await (await request.get("/weight")).text();

  expect(volumeHtml).toContain("explicitly labelled US liquid cups");
  expect(volumeHtml).toContain("Which cup, pint and quart variants are used?");
  expect(volumeHtml).toContain("NIST Guide to the SI");
  expect(weightHtml).toContain("14-pound British stone");
  expect(weightHtml).toContain("How many pounds are in one stone?");
});

test("fractional cups convert through smart search into shareable calculator state", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search categories, units, or type a conversion" });

  await search.fill("1 1/2 cups to ml");

  await expect(page.getByRole("option", { name: /Quick conversion/ })).toContainText("354.88235475 mL");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/volume\?/);
  expect(new URL(page.url()).searchParams.get("from")).toBe("us_cups");
  expect(new URL(page.url()).searchParams.get("value")).toBe("1.5");
  await expect(page.locator("#volume-result")).toHaveValue("354.88");
});

test("new cooking measures remain usable and accessible at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/volume?from=us_tablespoons&to=us_teaspoons&value=2");

  await expect(page.locator("#volume-result")).toHaveValue("6");
  await expect(page.getByRole("combobox", { name: "Source unit" })).toContainText("US Tablespoons");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
