import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("BMI page ships adult-scope guidance in prerendered HTML", async ({ request }) => {
  const response = await request.get("/bmi");
  const html = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(html).toContain("BMI Calculator");
  expect(html).toContain("For adults age 20 or older");
  expect(html).toContain("screening measure, not a diagnosis");
  expect(html).toContain("https://www.cdc.gov/bmi/adult-calculator/index.html");
});

test("BMI starts neutral and calculates after both measurements are entered", async ({ page }) => {
  await page.goto("/bmi", { waitUntil: "networkidle" });

  const height = page.getByRole("textbox", { name: "Height", exact: true });
  const weight = page.getByRole("textbox", { name: "Weight", exact: true });
  await expect(height).toHaveValue("");
  await expect(weight).toHaveValue("");
  await expect(page.getByText("Adult BMI estimate").locator("..").getByText("—")).toBeVisible();

  await height.fill("170");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await weight.fill("70");

  await expect(page.getByText("24.2", { exact: true })).toBeVisible();
  await expect(page.getByText("Healthy Weight", { exact: true }).first()).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("height")).toBe("170");
  await expect.poll(() => new URL(page.url()).searchParams.get("weight")).toBe("70");
});

test("BMI URL state hydrates cleanly and remains shareable", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|did not match/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/hydrat|did not match/i.test(error.message)) hydrationErrors.push(error.message);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as typeof window & { __copiedBmiUrl?: string }).__copiedBmiUrl = value;
        },
      },
    });
  });

  await page.goto("/bmi?height=170&weight=70&heightUnit=cm&weightUnit=kg", { waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "Height", exact: true })).toHaveValue("170");
  await expect(page.getByRole("textbox", { name: "Weight", exact: true })).toHaveValue("70");
  await expect(page.getByText("24.2", { exact: true })).toBeVisible();
  expect(hydrationErrors).toEqual([]);

  await page.getByRole("button", { name: "Copy BMI link" }).click();
  await expect(page.getByRole("status")).toHaveText("BMI link copied.");
  const copiedUrl = await page.evaluate(
    () => (window as typeof window & { __copiedBmiUrl?: string }).__copiedBmiUrl,
  );
  expect(copiedUrl).toBe(page.url());
});

test("BMI rejects malformed measurements without producing a result", async ({ page }) => {
  await page.goto("/bmi", { waitUntil: "domcontentloaded" });
  const height = page.getByRole("textbox", { name: "Height", exact: true });
  const weight = page.getByRole("textbox", { name: "Weight", exact: true });

  await height.fill("170cm");
  await weight.fill("70");
  await expect(page.getByRole("alert")).toContainText("Enter valid finite numbers");
  await expect(height).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Adult BMI estimate").locator("..").getByText("—")).toBeVisible();
});

test("BMI mobile layout has no serious accessibility violations or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/bmi?height=170&weight=70", { waitUntil: "networkidle" });

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
