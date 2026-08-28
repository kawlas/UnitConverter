import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as typeof window & { __copiedConversionResult?: string }).__copiedConversionResult = value;
        },
      },
    });
  });
});

test("copies the exact visible localized result without its unit", async ({ page }) => {
  await page.goto("/length?from=meters&to=feet&value=1&precision=4&locale=de-DE");
  await expect(page.locator("#length-result")).toHaveValue("3,2808");

  await page.getByRole("button", { name: "Copy result" }).click();

  await expect(page.getByRole("status")).toHaveText("Result copied.");
  expect(await page.evaluate(() =>
    (window as typeof window & { __copiedConversionResult?: string }).__copiedConversionResult,
  )).toBe("3,2808");
});

test("disables result copying when the input is invalid", async ({ page }) => {
  await page.goto("/length");
  const copyResult = page.getByRole("button", { name: "Copy result" });
  await expect(copyResult).toBeEnabled();

  await page.locator("#length-from-value").fill("not a number");

  await expect(page.locator("#length-result")).toHaveValue("");
  await expect(copyResult).toBeDisabled();
});

test("keeps the result action touch-sized without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/length");

  const copyResult = page.getByRole("button", { name: "Copy result" });
  await expect(copyResult).toBeVisible();
  const box = await copyResult.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
