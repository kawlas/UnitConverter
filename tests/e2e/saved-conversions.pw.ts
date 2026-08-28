import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seedSavedConversions = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    const timestamp = Date.now();
    localStorage.setItem("q-converter:history:v1", JSON.stringify([{
      categoryId: "weight",
      fromUnit: "kilograms",
      toUnit: "pounds",
      input: "2",
      result: "4.41",
      precision: 2,
      locale: "en-US",
      timestamp,
    }]));
    localStorage.setItem("q-converter:favorites:v1", JSON.stringify([{
      id: "volume:us_cups:milliliters",
      timestamp,
    }]));
  });
};

test("saved conversions are closed by default, readable and play across categories", async ({ page }) => {
  await seedSavedConversions(page);
  await page.goto("/length", { waitUntil: "networkidle" });

  const saved = page.locator("details").filter({ hasText: "Saved conversions" });
  await expect(saved).not.toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: /Open favorite Volume conversion/ })).toBeHidden();
  await saved.locator("summary").click();

  await expect(page.getByText("2 kg → 4.41 lb", { exact: true })).toBeVisible();
  await expect(page.getByText("US Cups → Milliliters", { exact: true })).toBeVisible();
  await expect(page.getByText("volume:us_cups:milliliters", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Open favorite Volume conversion: US Cups to Milliliters" }).click();
  await expect(page).toHaveURL(/\/volume\?from=us_cups&to=milliliters$/);
  await expect(page.getByLabel("Source unit")).toHaveText(/US Cups/);
  await expect(page.getByLabel("Target unit")).toHaveText(/Milliliters/);
});

test("action feedback stays beside the actions and does not shift layout", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/length", { waitUntil: "networkidle" });
  const allow = page.getByRole("button", { name: "Allow optional analytics" });
  if (await allow.count()) await allow.click();

  const favorite = page.getByRole("button", { name: "Toggle favorite" });
  const status = page.getByRole("status").filter({ hasText: "Added to favorites." });
  await favorite.click();
  await expect(status).toBeVisible();

  const favoriteBox = await favorite.boundingBox();
  const statusBox = await status.boundingBox();
  expect(favoriteBox).not.toBeNull();
  expect(statusBox).not.toBeNull();
  expect(statusBox!.y).toBeGreaterThanOrEqual(favoriteBox!.y + favoriteBox!.height);
  expect(statusBox!.y - (favoriteBox!.y + favoriteBox!.height)).toBeLessThanOrEqual(32);
  expect(statusBox!.y + statusBox!.height).toBeLessThanOrEqual(568);
});

test("expanded saved conversions remain accessible at 320px and clear safely", async ({ page }) => {
  await seedSavedConversions(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/length", { waitUntil: "networkidle" });
  const saved = page.locator("details").filter({ hasText: "Saved conversions" });
  await saved.locator("summary").click();

  const violations = (await new AxeBuilder({ page }).include("details").analyze()).violations
    .filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.getByRole("button", { name: "Clear saved data" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved data cleared." })).toBeVisible();
  await expect(saved).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("q-converter:history:v1"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("q-converter:favorites:v1"))).toBeNull();
});
