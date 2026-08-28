import { describe, expect, it } from "vitest";
import {
  convertCookingMeasurement,
  cookingIngredients,
  parseCookingValue,
} from "./cooking-conversions";

describe("ingredient-aware cooking conversions", () => {
  it("uses a cited, unique and explicitly qualified launch catalog", () => {
    expect(cookingIngredients.map(({ id }) => id)).toEqual([
      "all-purpose-flour",
      "granulated-sugar",
      "packed-brown-sugar",
      "solid-butter",
      "whole-milk",
    ]);
    expect(new Set(cookingIngredients.map(({ id }) => id)).size).toBe(cookingIngredients.length);

    for (const ingredient of cookingIngredients) {
      expect(ingredient.gramsPerUsCup).toBeGreaterThan(0);
      expect(ingredient.assumption.length).toBeGreaterThan(10);
      expect(ingredient.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("converts both directions using the selected ingredient reference weight", () => {
    expect(convertCookingMeasurement(120, "grams-to-cups", "all-purpose-flour")).toBe(1);
    expect(convertCookingMeasurement(1.5, "cups-to-grams", "all-purpose-flour")).toBe(180);
    expect(convertCookingMeasurement(99, "grams-to-cups", "granulated-sugar")).toBe(0.5);
    expect(convertCookingMeasurement(0.5, "cups-to-grams", "packed-brown-sugar")).toBe(106.5);
  });

  it("accepts practical decimal input but rejects empty, negative and malformed values", () => {
    expect(parseCookingValue(" 120.5 ")).toEqual({ status: "ready", value: 120.5 });
    expect(parseCookingValue("0")).toEqual({ status: "ready", value: 0 });
    expect(parseCookingValue("")).toEqual({ status: "empty" });
    expect(parseCookingValue("-1")).toEqual({ status: "error", message: "Enter zero or a positive value." });
    expect(parseCookingValue("1 cup")).toEqual({ status: "error", message: "Enter a number only, such as 120 or 1.5." });
  });

  it("rejects unknown ingredients instead of silently assuming water density", () => {
    expect(() => convertCookingMeasurement(100, "grams-to-cups", "water")).toThrow(
      "Unknown cooking ingredient",
    );
  });
});
