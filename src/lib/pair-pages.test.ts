import { describe, expect, it } from "vitest";
import { getCategory, getUnit } from "./conversion-data";
import { convertExact } from "./conversions";
import { getPairPage, pairPagePath, pairPages } from "./pair-pages";

describe("curated conversion pair pages", () => {
  it("keeps the evidence-backed cluster controlled and unique", () => {
    expect(pairPages.length).toBeGreaterThanOrEqual(6);
    expect(pairPages.length).toBeLessThanOrEqual(22);
    expect(new Set(pairPages.map(pairPagePath)).size).toBe(pairPages.length);
    expect(new Set(pairPages.map(({ title }) => title)).size).toBe(pairPages.length);
    expect(new Set(pairPages.map(({ description }) => description)).size).toBe(pairPages.length);
    expect(new Set(pairPages.map(({ intro }) => intro)).size).toBe(pairPages.length);
    expect(new Set(pairPages.map(({ formula }) => formula)).size).toBe(pairPages.length);
  });

  it("includes the first researched demand expansion", () => {
    expect(pairPages.map(pairPagePath)).toEqual(expect.arrayContaining([
      "/length/miles-to-kilometers",
      "/speed/mph-to-kph",
      "/weight/grams-to-ounces",
      "/volume/us-cups-to-milliliters",
      "/weight/stone-to-kilograms",
      "/area/square-feet-to-square-meters",
      "/area/hectare-to-square-meters",
      "/area/square-meters-to-hectare",
      "/fuel/miles-per-gallon-to-liters-per-100km",
      "/fuel/miles-per-imperial-gallon-to-liters-per-100km",
    ]));
  });

  it("references only supported pairs and computes every published example", () => {
    for (const pair of pairPages) {
      const category = getCategory(pair.categoryId);
      expect(category, pairPagePath(pair)).toBeDefined();
      expect(category!.converter, pairPagePath(pair)).not.toBe("calculator");
      expect(getUnit(category!, pair.fromUnit), pairPagePath(pair)).toBeDefined();
      expect(getUnit(category!, pair.toUnit), pairPagePath(pair)).toBeDefined();
      expect(pair.id, pairPagePath(pair)).toBe(`${pair.fromUnit}-to-${pair.toUnit}`.replace(/_/g, "-"));
      expect(pair.fromUnit, pairPagePath(pair)).not.toBe(pair.toUnit);
      expect(pair.examples.length, pairPagePath(pair)).toBeGreaterThanOrEqual(5);
      expect(new Set(pair.examples).size, pairPagePath(pair)).toBe(pair.examples.length);
      expect(pair.description.length, pairPagePath(pair)).toBeLessThanOrEqual(155);
      expect(pair.intro.length, pairPagePath(pair)).toBeGreaterThanOrEqual(80);

      for (const value of pair.examples) {
        expect(Number.isFinite(convertExact(value, pair.fromUnit, pair.toUnit, pair.categoryId))).toBe(true);
      }
    }
  });

  it("resolves only exact curated category and pair IDs", () => {
    const pair = pairPages[0];
    expect(getPairPage(pair.categoryId, pair.id)).toBe(pair);
    expect(getPairPage(pair.categoryId, `${pair.id}-extra`)).toBeUndefined();
    expect(getPairPage("missing", pair.id)).toBeUndefined();
  });
});
