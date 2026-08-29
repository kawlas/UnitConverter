import { expect, test } from "@playwright/test";

const MOBILE = { width: 320, height: 568 };
const DESKTOP = { width: 1280, height: 800 };

test.describe("320x568 mobile viewport", () => {
  test("complete primary conversion flow stays above the fold", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.addInitScript(() => {
      localStorage.setItem(
        "q-converter:analytics-consent:v1",
        JSON.stringify({ choice: "declined", updatedAt: Date.now() }),
      );
    });
    for (const landing of [
      { path: "/length", heading: "Length Converter" },
      { path: "/length/meters-to-feet", heading: "Meters to Feet Converter" },
    ]) {
      await page.goto(landing.path, { waitUntil: "networkidle" });

      const primaryControls = [
        page.getByRole("heading", { name: landing.heading, exact: true }),
        page.getByRole("textbox", { name: "From" }),
        page.getByRole("combobox", { name: "Source unit" }),
        page.getByRole("button", { name: "Swap units" }),
        page.getByRole("textbox", { name: "To" }),
        page.getByRole("button", { name: "Copy result" }),
        page.getByRole("combobox", { name: "Target unit" }),
      ];

      for (const control of primaryControls) {
        const box = await control.boundingBox();
        expect(box, `${landing.path}: primary conversion control not found`).not.toBeNull();
        expect(
          box!.y + box!.height,
          `${landing.path}: primary conversion control bottom (${(box!.y + box!.height).toFixed(0)}) must fit within ${MOBILE.height}px`,
        ).toBeLessThanOrEqual(MOBILE.height);
      }

      await expect(page.getByRole("textbox", { name: "To" })).toHaveValue("3.28");
    }
  });

  test("length converter input is fully visible and consent does not overlap it", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/length", { waitUntil: "networkidle" });

    const inputBox = await page.locator("#length-from-value").boundingBox();
    expect(inputBox, "#length-from-value not found").not.toBeNull();
    expect(inputBox!.y + inputBox!.height, `#length-from-value bottom (${(inputBox!.y + inputBox!.height).toFixed(0)}) must be <= 380`)
      .toBeLessThanOrEqual(380);
    const sourceUnitBox = await page.getByRole("combobox", { name: "Source unit" }).boundingBox();
    expect(sourceUnitBox, "Source unit selector not found").not.toBeNull();

    const consentBox = await page.locator('[aria-label="Analytics privacy choices"]').boundingBox();
    if (consentBox) {
      expect(consentBox.y, "consent banner must not overlap the value or source-unit controls")
        .toBeGreaterThanOrEqual(sourceUnitBox!.y + sourceUnitBox!.height);
    }
  });

  test("length converter has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/length", { waitUntil: "networkidle" });
    const dims = await page.evaluate(() => ({
      vw: window.innerWidth,
      doc: document.documentElement.scrollWidth,
    }));
    expect(dims.doc, `scrollWidth ${dims.doc} > viewport ${dims.vw}`).toBeLessThanOrEqual(dims.vw);
  });

  test("consent banner buttons are side-by-side on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/length", { waitUntil: "networkidle" });
    const consent = page.locator('[aria-label="Analytics privacy choices"]');
    await expect(consent).toBeVisible();
    const buttons = consent.getByRole("button");
    const b1 = await buttons.nth(0).boundingBox();
    const b2 = await buttons.nth(1).boundingBox();
    expect(b1, "Allow button not found").not.toBeNull();
    expect(b2, "Decline button not found").not.toBeNull();
    expect(Math.abs(b1!.y - b2!.y), "buttons must be on the same row (y diff <= 4px)").toBeLessThanOrEqual(4);
  });

  test("consent banner has role=region and accessible button labels", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/length", { waitUntil: "networkidle" });
    const consent = page.locator('[aria-label="Analytics privacy choices"]');
    await expect(consent).toHaveAttribute("role", "region");
    await expect(consent.getByRole("button", { name: "Allow optional analytics" })).toBeVisible();
    await expect(consent.getByRole("button", { name: "Use without analytics" })).toBeVisible();
  });
});

test.describe("smoke — desktop viewport", () => {
  test("length converter loads H1, input, result", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/length", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#length-from-value")).toBeVisible();
    await expect(page.locator("#length-result")).toBeVisible();
  });

  test("length converter converts 5 m to ft (default preset)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/length", { waitUntil: "networkidle" });
    await page.locator("#length-from-value").fill("5");
    await expect(page.locator("#length-result")).toHaveValue("16.4");
  });
});

test.describe("smoke — BMI calculator", () => {
  test("BMI calculator loads with height as the first input", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bmi", { waitUntil: "networkidle" });
    const inputs = page.getByRole("textbox");
    await expect(inputs.first()).toHaveAttribute("id", "bmi-height");
  });

  test("BMI copy link button is visible on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bmi", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
  });
});

test.describe("smoke — pair pages", () => {
  test("pair page loads and pre-fills from/to units", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/length/meters-to-feet", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Meters to Feet");
    await expect(page.getByRole("combobox", { name: "Source unit" })).toContainText("Meters");
    await expect(page.getByRole("combobox", { name: "Target unit" })).toContainText("Feet");
  });

  test("pair page breadcrumb back link is visible on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/length/meters-to-feet", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: /all.*length.*conversions/i })).toBeVisible();
  });
});
