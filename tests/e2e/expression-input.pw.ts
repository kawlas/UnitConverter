import { expect, test } from "@playwright/test";

test("expression input converts and keeps the raw arithmetic in the URL", async ({ page }) => {
  await page.goto("/length?from=inches&to=centimeters&value=(12*4)%2B6.5&precision=2");

  const input = page.locator("#length-from-value");
  await expect(input).toHaveValue("(12*4)+6.5");
  expect(new URL(page.url()).searchParams.get("value")).toBe("(12*4)+6.5");
  await expect(page.locator("#length-result")).toHaveValue("138.43");
});

test("division operator converts and keeps the raw expression shareable", async ({ page }) => {
  await page.goto("/length?from=inches&to=centimeters&precision=2");

  const input = page.locator("#length-from-value");
  await input.fill("10÷4");

  await expect(page.locator("#length-result")).toHaveValue("6.35");
  expect(new URL(page.url()).searchParams.get("value")).toBe("10÷4");
});

test("unsafe or malformed expressions get actionable feedback and cannot be copied", async ({ page }) => {
  await page.goto("/length");

  await page.locator("#length-from-value").fill("1/0 + 2");

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy result" })).toBeDisabled();
  await expect(page.locator("#length-result")).toHaveValue("");
});
