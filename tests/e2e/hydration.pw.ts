import { expect, test } from "@playwright/test";

test.describe("Hydration tests - no React hydration mismatches", () => {
  const routes = ["/", "/bmi", "/length"] as const;

  for (const route of routes) {
    test(`route ${route} has no React hydration mismatches`, async ({ page }) => {
      const hydrationErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" && /hydrat|did not match/i.test(message.text())) {
          hydrationErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        if (/hydrat|did not match/i.test(error.message)) hydrationErrors.push(error.message);
      });

      await page.goto(route, { waitUntil: "networkidle" });
      // No additional timeout needed; errors should have been emitted by now.
      expect(hydrationErrors, `Unexpected hydration mismatches on ${route}: ${hydrationErrors.join("\n")}`).toEqual([]);
    });
  }
});
