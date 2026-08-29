import { expect, test } from "@playwright/test";

test("compare-all content is present in prerendered category HTML", async ({ request }) => {
  const response = await request.get("/length");
  const html = await response.text();
  const normalizedHtml = html.replace(/<!--.*?-->/g, "");

  expect(response.ok()).toBeTruthy();
  expect(normalizedHtml).toContain("Compare all length units");
  expect(normalizedHtml).toContain("Equivalent length values in every supported unit");
  expect(normalizedHtml).toContain("Nautical Miles");
});

test("one input produces every equivalent and a row can become the target", async ({ page }) => {
  await page.goto("/length?from=meters&to=feet&value=1&precision=2&locale=en-US", { waitUntil: "networkidle" });

  const comparison = page.getByRole("region", { name: "Compare all length units" });
  await expect(comparison.getByRole("row")).toHaveCount(10);
  await expect(comparison.getByRole("row", { name: /Feet ft 3\.28 Selected/ })).toBeVisible();
  await expect(comparison.getByRole("row", { name: /Inches in 39\.37/ })).toBeVisible();
  await expect(comparison.getByRole("row", { name: /Miles mi 6\.21[eE]-4/ })).toBeVisible();

  await comparison.getByRole("button", { name: "Use Nautical Miles as target" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("to")).toBe("nautical_miles");
  await expect(page.getByRole("combobox", { name: "Target unit" })).toContainText("Nautical Miles");
  await expect(comparison.getByRole("row", { name: /Nautical Miles nmi .* Selected/ })).toBeVisible();
});

test("compare-all follows locale and precision and handles invalid input", async ({ page }) => {
  await page.goto("/length?from=meters&to=feet&value=1&precision=2&locale=de-DE", { waitUntil: "networkidle" });
  const comparison = page.getByRole("region", { name: "Compare all length units" });
  await expect(comparison.getByRole("row", { name: /Feet ft 3,28 Selected/ })).toBeVisible();

  await page.getByRole("textbox", { name: "From" }).fill("not-a-number");
  await expect(comparison.getByText("Enter a valid value above to compare all units.")).toBeVisible();
  await expect(comparison.getByRole("table")).toHaveCount(0);
});

test("category examples provide meaningful, valid first-load comparisons", async ({ page }) => {
  await page.goto("/fuel", { waitUntil: "networkidle" });

  await expect(page.getByRole("textbox", { name: "From" })).toHaveValue("7");
  await expect(page.getByRole("alert")).toHaveCount(0);
  const comparison = page.getByRole("region", { name: "Compare all fuel economy units" });
  await expect(comparison.getByRole("row", { name: /Miles per Gallon \(US\) mpg 33\.6 Selected/ })).toBeVisible();

  await page.getByRole("textbox", { name: "From" }).fill("12");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "From" })).toHaveValue("7");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
