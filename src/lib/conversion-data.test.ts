import { describe, expect, it } from "vitest";
import { categories, defaultUnits, getCategory } from "./conversion-data";

describe("default conversion units", () => {
  it("preserves the baseline speed defaults", () => {
    expect(defaultUnits(getCategory("speed")!)).toEqual({ from: "kph", to: "mph" });
  });

  it("preserves the baseline area defaults", () => {
    expect(defaultUnits(getCategory("area")!)).toEqual({ from: "square_meters", to: "square_feet" });
  });
});

describe("category answer content", () => {
  it("answers a concrete category-specific question instead of a generic definition", () => {
    const expectedQuestions: Record<string, string> = {
      power: "Are mechanical and metric horsepower the same?",
      energy: "What is the difference between a calorie and a food Calorie?",
      speed: "What does one knot mean?",
      length: "How long are an inch and a foot exactly?",
      temperature: "What is absolute zero on each supported scale?",
      pressure: "How are bar and standard atmosphere defined in pascals?",
      digital: "What is the difference between kB and KiB?",
      time: "Does this converter treat months and years as fixed durations?",
      angle: "How do degrees, radians and gradians describe a full turn?",
      fuel: "Why does fuel-economy conversion use division instead of multiplication?",
      pace: "How do minutes per kilometer and minutes per mile relate?",
    };

    for (const [categoryId, question] of Object.entries(expectedQuestions)) {
      const category = categories.find(({ id }) => id === categoryId)!;
      expect(category.faq[0].question, categoryId).toBe(question);
      expect(category.faq[0].answer.length, categoryId).toBeGreaterThan(60);
    }
  });
});
