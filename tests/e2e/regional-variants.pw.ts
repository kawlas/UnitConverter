import { expect, test } from "@playwright/test";

test("volume calculator never hides whether a gallon is US or Imperial", async ({ page }) => {
  await page.goto("/volume?from=imperial_gallons&to=liters&value=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("Source unit")).toHaveValue("imperial_gallons");
  await expect(page.getByLabel("Source unit").locator("option:checked")).toHaveText("Imperial Gallons (UK) (imp gal)");
  await expect(page.locator("#volume-result")).toHaveValue("4.55");
});

test("fuel calculator exposes both US and UK MPG", async ({ page }) => {
  await page.goto("/fuel?from=liters_per_100km&to=miles_per_imperial_gallon&value=7&precision=4", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("Target unit")).toHaveValue("miles_per_imperial_gallon");
  await expect(page.getByLabel("Target unit").locator("option:checked")).toHaveText("Miles per Imperial Gallon (UK) (mpg (UK))");
  await expect(page.locator("#fuel-result")).toHaveValue("40.3544");
});
