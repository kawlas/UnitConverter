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
