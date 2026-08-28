import { describe, expect, it } from "vitest";
import { categories } from "./conversion-data";
import { getMethodology, methodologySources } from "./methodology";

describe("methodology references", () => {
  it("provides scoped HTTPS references for every shipped category", () => {
    for (const category of categories) {
      const sources = getMethodology(category.id);
      expect(sources.length, category.id).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.title.trim()).not.toBe("");
        expect(source.scope.trim()).not.toBe("");
      }
    }
  });

  it("uses specialist references only in their relevant categories", () => {
    expect(getMethodology("digital").map(({ organization }) => organization)).toEqual(["BIPM", "IEC"]);
    expect(getMethodology("bmi").map(({ organization }) => organization)).toEqual(["CDC"]);
    expect(getMethodology("length").map(({ organization }) => organization)).toEqual(["BIPM", "NIST"]);
    expect(getMethodology("unknown")).toEqual([]);
  });

  it("keeps source identifiers unique and avoids endorsement claims", () => {
    const sources = Object.values(methodologySources);
    expect(new Set(sources.map(({ id }) => id)).size).toBe(sources.length);
    for (const source of sources) {
      expect(`${source.title} ${source.scope}`).not.toMatch(/\b(certified|endorsed|approved|verified by)\b/i);
    }
  });
});
