import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("grams-to-cups ships a useful prerendered answer and transparent sources", async ({ request }) => {
  const response = await request.get("/grams-to-cups");
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain("Grams to Cups Calculator");
  expect(html).toContain('rel="canonical" href="https://qconverter.netlify.app/grams-to-cups"');
  expect(html).toContain("What are you measuring?");
  expect(html).toContain("Reference used:");
  expect(html).toContain("120");
  expect(html).toContain("King Arthur Baking");
  expect(html).toContain("Ingredient Weight Chart");
  expect(html).toContain("Why do grams-to-cups results depend on the ingredient?");
});

test("ingredient choice changes the answer and swap preserves the same quantity", async ({ page }) => {
  await page.goto("/grams-to-cups", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Grams to Cups Calculator", exact: true })).toBeVisible();
  await expect(page.getByLabel("What are you measuring?")).toHaveValue("all-purpose-flour");
  await expect(page.getByRole("textbox", { name: "Grams", exact: true })).toHaveValue("120");
  await expect(page.locator("#cooking-result")).toHaveText("1");
  await expect(page.getByText(/120 g of flour ≈ 1 US cup$/)).toBeVisible();

  await page.getByLabel("What are you measuring?").selectOption("granulated-sugar");
  await page.getByRole("textbox", { name: "Grams", exact: true }).fill("99");
  await expect(page.locator("#cooking-result")).toHaveText("0.5");
  await expect(page.getByText(/99 g of granulated sugar ≈ 0.5 US cups/)).toBeVisible();

  await page.getByRole("button", { name: "Swap direction to us cups to grams" }).click();
  await expect(page.getByRole("textbox", { name: "US cups", exact: true })).toHaveValue("0.5");
  await expect(page.locator("#cooking-result")).toHaveText("99");
  await expect.poll(() => new URL(page.url()).searchParams.get("direction")).toBe("cups-to-grams");
  expect(new URL(page.url()).searchParams.get("ingredient")).toBe("granulated-sugar");
});

test("the cooking calculator is accessible, visible and overflow-free at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/grams-to-cups", { waitUntil: "networkidle" });

  const input = page.getByRole("textbox", { name: "Grams", exact: true });
  const result = page.locator("#cooking-result");
  await expect(input).toBeVisible();
  await expect(result).toBeVisible();
  const inputBox = await input.boundingBox();
  const resultBox = await result.boundingBox();
  expect(inputBox!.y).toBeLessThan(568);
  expect(resultBox!.y).toBeLessThan(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const accessibility = await new AxeBuilder({ page }).include("main").analyze();
  const blocking = accessibility.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test("homepage search reaches the ingredient-aware calculator", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search categories, units, or type a conversion" });
  await search.fill("grams to cups");
  await expect(page.getByRole("option", { name: /Grams to Cups/ })).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/grams-to-cups$/);
});
