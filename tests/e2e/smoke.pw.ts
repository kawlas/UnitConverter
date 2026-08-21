import { expect, test } from "@playwright/test";

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
