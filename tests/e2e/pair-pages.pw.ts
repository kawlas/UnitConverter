import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pairPagePath, pairPages } from "../../src/lib/pair-pages";

test("every curated pair ships unique, useful first-response HTML", async ({ request }) => {
  for (const pair of pairPages) {
    const path = pairPagePath(pair);
    const response = await request.get(path);
    const html = (await response.text()).replace(/<!--.*?-->/g, "");

    expect(response.status(), path).toBe(200);
    expect(html, path).toContain(`<title>${pair.title} — Q Converter</title>`);
    expect(html, path).toContain(`rel="canonical" href="https://qconverter.netlify.app${path}"`);
    expect(html, path).toContain(pair.title);
    expect(html, path).toContain(pair.intro);
    expect(html, path).toContain(pair.formula);
    expect(html, path).toContain("Compare all");
    expect(html, path).toContain("Sources &amp; methodology");
    expect(html, path).toContain('type="application/ld+json"');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
      .map(([, schema]) => JSON.parse(schema) as { "@type"?: string; itemListElement?: Array<{ item?: string }> });
    const breadcrumb = schemas.find((schema) => schema["@type"] === "BreadcrumbList");
    expect(breadcrumb?.itemListElement?.every(({ item }) => Boolean(item)), path).toBe(true);
  }
});

test("pair route presets the calculator and keeps interactive state shareable", async ({ page }) => {
  await page.goto("/length/meters-to-feet", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Meters to Feet Converter", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Source unit" })).toContainText("Meters");
  await expect(page.getByRole("combobox", { name: "Target unit" })).toContainText("Feet");
  await expect(page.getByRole("textbox", { name: "From" })).toHaveValue("1");
  await expect(page.getByRole("textbox", { name: "To" })).toHaveValue("3.28");
  await expect(page.getByRole("region", { name: "Related length conversions" })).toContainText("Kilometers to Miles");
  const faqSchemaQuestions = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts
      .map((script) => JSON.parse(script.textContent ?? "{}"))
      .find((schema) => schema["@type"] === "FAQPage")
      ?.mainEntity.map((item: { name: string }) => item.name) ?? [],
  );
  await expect(page.getByRole("region", { name: "Frequently asked questions" }).locator("summary")).toHaveText(faqSchemaQuestions);

  await page.getByRole("region", { name: "Compare all length units" }).getByRole("button", { name: "Use Inches as target" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("to")).toBe("inches");
  await expect(page).toHaveURL(/\/length\/meters-to-feet\?/);
  await expect(page.getByRole("combobox", { name: "Target unit" })).toContainText("Inches");
});

test("category pages link to their curated pair references", async ({ page }) => {
  await page.goto("/length", { waitUntil: "domcontentloaded" });

  const common = page.getByRole("region", { name: "Common length conversions" });
  await expect(common.getByRole("link", { name: /Meters to Feet/ })).toHaveAttribute("href", "/length/meters-to-feet");
  await expect(common.getByRole("link", { name: /Kilometers to Miles/ })).toHaveAttribute("href", "/length/kilometers-to-miles");
  await expect(common.getByRole("link", { name: /Centimeters to Inches/ })).toHaveAttribute("href", "/length/centimeters-to-inches");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const homeReferences = page.getByRole("region", { name: "Common unit conversions" });
  await expect(homeReferences.getByRole("link")).toHaveCount(pairPages.length);
  await expect(homeReferences.getByRole("link", { name: /Meters to Feet/ })).toHaveAttribute("href", "/length/meters-to-feet");
});

test("pair query state hydrates cleanly", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|did not match/i.test(message.text())) hydrationErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (/hydrat|did not match/i.test(error.message)) hydrationErrors.push(error.message);
  });

  await page.goto("/length/meters-to-feet?value=2&precision=3&locale=en-US", { waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "From" })).toHaveValue("2");
  await expect(page.getByRole("textbox", { name: "To" })).toHaveValue("6.562");
  expect(hydrationErrors).toEqual([]);
});

test("pair routes preserve real 404s and canonical trailing-slash documents", async ({ request }) => {
  const unknown = await request.get("/length/meters-to-missing", { maxRedirects: 0 });
  expect(unknown.status()).toBe(404);
  expect(await unknown.text()).toContain('name="robots" content="noindex, follow"');

  const trailing = await request.get("/length/meters-to-feet/?value=2", { maxRedirects: 0 });
  expect(trailing.status()).toBe(200);
  expect(await trailing.text()).toContain(
    'rel="canonical" href="https://qconverter.netlify.app/length/meters-to-feet"',
  );
});

test("pair page remains accessible without horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/temperature/celsius-to-fahrenheit", { waitUntil: "networkidle" });

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
