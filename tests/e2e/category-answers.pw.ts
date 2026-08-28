import { expect, test } from "@playwright/test";
import { categories } from "../../src/lib/conversion-data";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#x27;");

test("every category ships its concrete answers in visible HTML and matching JSON-LD", async ({ request }) => {
  for (const category of categories) {
    const response = await request.get(`/${category.id}`);
    expect(response.status(), category.id).toBe(200);
    const html = await response.text();

    for (const item of category.faq) {
      expect(html.split(item.question).length - 1, `${category.id}:${item.question}`).toBeGreaterThanOrEqual(2);
      expect(html, `${category.id}:${item.answer}`).toContain(escapeHtml(item.answer));
    }

    const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
      .map(([, json]) => JSON.parse(json));
    const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
    expect(faqSchema?.mainEntity.map((entry: { name: string }) => entry.name), category.id)
      .toEqual(category.faq.map(({ question }) => question));
    expect(faqSchema?.mainEntity.map((entry: { acceptedAnswer: { text: string } }) => entry.acceptedAnswer.text), category.id)
      .toEqual(category.faq.map(({ answer }) => answer));
  }
});
