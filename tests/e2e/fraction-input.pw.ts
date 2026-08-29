import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("fraction URL state hydrates cleanly and remains shareable", async ({ page }) => {
  await page.goto("/length?from=inches&to=centimeters&value=1%201%2F2&precision=2");

  const input = page.locator("#length-from-value");
  await expect(input).toHaveValue("1 1/2");
  await expect(input).toHaveAttribute("inputmode", "text");
  await expect(page.locator("#length-result")).toHaveValue("3.81");
  expect(new URL(page.url()).searchParams.get("value")).toBe("1 1/2");
});

test("typed vulgar fractions convert, compare and persist without losing the original input", async ({ page }) => {
  await page.goto("/length?from=inches&to=centimeters&precision=4");
  const input = page.locator("#length-from-value");

  await input.fill("⅜");

  await expect(page.locator("#length-result")).toHaveValue("0.9525");
  await expect(page.getByRole("cell", { name: "0.375" }).first()).toBeVisible();
  expect(new URL(page.url()).searchParams.get("value")).toBe("⅜");
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("q-converter:history:v1") ?? "[]")[0]?.input,
  )).toBe("⅜");
});

test("smart search accepts mixed numbers and opens normalized shareable state", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search categories, units, or type a conversion" });

  await search.fill("1 1/2 ft to cm");

  await expect(page.getByRole("option", { name: /Instant answer/ })).toContainText("45.72 cm");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/length\?/);
  expect(new URL(page.url()).searchParams.get("value")).toBe("1.5");
  await expect(page.locator("#length-result")).toHaveValue("45.72");
});

test("zero denominators get actionable feedback and cannot be copied", async ({ page }) => {
  await page.goto("/length");

  await page.locator("#length-from-value").fill("1/0");

  await expect(page.getByRole("alert")).toContainText("fraction");
  await expect(page.getByRole("button", { name: "Copy result" })).toBeDisabled();
  await expect(page.locator("#length-result")).toHaveValue("");
});

test("fraction guidance is accessible without overflowing at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/length");

  await expect(page.getByText(/Enter a decimal, fraction or quick calculation/)).toBeVisible();
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
