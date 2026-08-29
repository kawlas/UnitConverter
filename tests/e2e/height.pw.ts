import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("height calculator ships a useful prerendered answer and exact method", async ({ request }) => {
  const response = await request.get("/height");
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain("Height Calculator");
  expect(html).toContain('rel="canonical" href="https://qconverter.netlify.app/height"');
  expect(html).toContain("Centimeters");
  expect(html).toContain("Feet + inches");
  expect(html).toContain("5 ft 10.87 in");
  expect(html).toContain("1 inch = 2.54 centimeters exactly");
  expect(html).toContain("NIST");
});

test("height conversion is two-way, shareable and copyable", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/height?direction=cm-to-feet-inches&cm=180&precision=2", { waitUntil: "networkidle" });

  await expect(page.getByRole("textbox", { name: "Centimeters" })).toHaveValue("180");
  await expect(page.locator("#height-result")).toHaveText("5 ft 10.87 in");

  await page.getByRole("button", { name: "Swap height direction" }).click();
  await expect(page.getByRole("textbox", { name: "Feet" })).toHaveValue("5");
  await expect(page.getByRole("textbox", { name: "Inches" })).toHaveValue(/10\.866/);
  await expect(page.locator("#height-result")).toHaveText("180 cm");
  expect(new URL(page.url()).searchParams.get("direction")).toBe("feet-inches-to-cm");

  await page.getByRole("button", { name: "Copy height result" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("180 cm");
});

test("home understands centimeters to feet and inches as a human height", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("combobox", { name: "Search categories, units, or type a conversion" });
  await search.fill("180 cm in feet and inches");

  await expect(page.getByRole("option", { name: /Instant answer.*180 cm.*5 ft 10\.87 in/i })).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/height\?direction=cm-to-feet-inches&cm=180&precision=2$/);
  await expect(page.locator("#height-result")).toHaveText("5 ft 10.87 in");
});

test("height calculator keeps the primary task visible and accessible at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "q-converter:analytics-consent:v1",
      JSON.stringify({ choice: "declined", updatedAt: Date.now() }),
    );
  });
  await page.goto("/height", { waitUntil: "networkidle" });

  const input = page.getByRole("textbox", { name: "Centimeters" });
  const result = page.locator("#height-result");
  const copy = page.getByRole("button", { name: "Copy height result" });
  for (const control of [input, result, copy]) {
    const box = await control.boundingBox();
    expect(box, "primary height control not found").not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  }

  const accessibility = await new AxeBuilder({ page }).include("main").analyze();
  const blocking = accessibility.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
