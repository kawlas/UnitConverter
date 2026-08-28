import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("batch conversion handles mixed local values and copies only valid rows", async ({ page }) => {
  await page.goto("/length?from=meters&to=feet&precision=2", { waitUntil: "networkidle" });

  const batch = page.locator("summary").filter({ hasText: "Batch conversion" });
  await expect(page.locator("#length-batch-input")).toBeHidden();
  await batch.click();

  const input = page.locator("#length-batch-input");
  await input.fill("1\n3/8\n(2+3)*4\n1/0\nbad");
  await expect(page.getByTestId("batch-results").getByRole("listitem")).toHaveCount(5);
  await expect(page.locator("#length-batch-status")).toHaveText("3 of 5 lines converted.");
  await expect(page.getByText(/non-zero denominator/)).toBeVisible();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (text: string) => { (window as typeof window & { __batchCopy?: string }).__batchCopy = text; return Promise.resolve(); } },
    });
  });
  await page.getByRole("button", { name: "Copy all" }).click();
  await expect(page.getByText("Batch results copied.")).toBeVisible();
  const copied = await page.evaluate(() => (window as typeof window & { __batchCopy?: string }).__batchCopy ?? "");
  expect(copied.split("\n")).toHaveLength(3);
  expect(copied).toContain("Meters →");
  expect(copied).not.toContain("bad");
});

test("batch conversion rejects the whole oversized batch", async ({ page }) => {
  await page.goto("/length", { waitUntil: "networkidle" });
  await page.locator("summary").filter({ hasText: "Batch conversion" }).click();

  const input = page.locator("#length-batch-input");
  await input.fill(Array.from({ length: 101 }, (_, index) => String(index + 1)).join("\n"));
  await expect(page.locator("#length-batch-status")).toContainText("whole batch was rejected");
  await expect(page.getByTestId("batch-results")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy all" })).toBeDisabled();
});

test("batch conversion remains accessible without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/length", { waitUntil: "networkidle" });
  await page.locator("summary").filter({ hasText: "Batch conversion" }).click();
  await page.locator("#length-batch-input").fill("1\n2\n3");

  const violations = (await new AxeBuilder({ page }).include("#length-batch-input").analyze()).violations
    .filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
