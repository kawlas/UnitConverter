import { expect, test } from "@playwright/test";

test("reserved ad space follows useful content and makes no external requests", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });

  await page.goto("/length", { waitUntil: "networkidle" });
  const converter = page.getByRole("region", { name: "Length conversion workspace" });
  const advertisement = page.getByLabel("Advertisement");
  await expect(converter).toBeVisible();
  await expect(advertisement).toHaveAttribute("data-ad-placement", "converter-after-answer");

  const converterBox = await converter.boundingBox();
  const advertisementBox = await advertisement.boundingBox();
  expect(advertisementBox!.y).toBeGreaterThan(converterBox!.y + converterBox!.height);
  expect(externalRequests).toEqual([]);
});

test("home placeholder stays below categories without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const categories = page.getByRole("region", { name: "Pick a conversion" });
  const advertisement = page.getByLabel("Advertisement");
  await expect(advertisement).toHaveAttribute("data-ad-placement", "home-after-categories");

  const categoriesBox = await categories.boundingBox();
  const advertisementBox = await advertisement.boundingBox();
  expect(advertisementBox!.y).toBeGreaterThan(categoriesBox!.y + categoriesBox!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
