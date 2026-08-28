import { describe, expect, it } from "vitest";
import { categories, defaultUnits } from "./conversion-data";
import { ConversionError, convertAllExact, convertExact } from "./conversions";

const lookupTokens = (unit: (typeof categories)[number]["units"][number]) =>
  new Set([
    `name:${unit.value.trim().toLowerCase()}`,
    `symbol:${unit.symbol.trim()}`,
    ...unit.aliases.map((token) => `name:${token.trim().toLowerCase()}`),
  ]);

describe("conversion catalog invariants", () => {
  it("uses unique category, unit and lookup identifiers", () => {
    expect(new Set(categories.map(({ id }) => id)).size).toBe(categories.length);

    for (const category of categories) {
      expect(new Set(category.units.map(({ value }) => value)).size, category.id).toBe(category.units.length);
      const owners = new Map<string, string>();
      for (const unit of category.units) {
        for (const token of lookupTokens(unit)) {
          expect(owners.get(token), `${category.id}:${token}`).toBeUndefined();
          owners.set(token, unit.value);
        }
      }
    }
  });

  it("defines finite positive factors and complete affine transforms", () => {
    for (const category of categories) {
      for (const unit of category.units) {
        if (unit.kind === "linear") {
          expect(Number.isFinite(unit.toBaseFactor), `${category.id}:${unit.value}`).toBe(true);
          expect(unit.toBaseFactor, `${category.id}:${unit.value}`).toBeGreaterThan(0);
        } else {
          expect(unit.toBase, `${category.id}:${unit.value}`).toBeTypeOf("function");
          expect(unit.fromBase, `${category.id}:${unit.value}`).toBeTypeOf("function");
        }
      }
    }
  });

  it("round-trips every supported pair and preserves identity", () => {
    for (const category of categories.filter(({ converter }) => converter !== "calculator")) {
      const sample = category.id === "temperature" ? 20 : 7.25;
      for (const from of category.units) {
        expect(convertExact(sample, from.value, from.value, category.id)).toBe(sample);
        for (const to of category.units) {
          const converted = convertExact(sample, from.value, to.value, category.id);
          expect(
            convertExact(converted, to.value, from.value, category.id),
            `${category.id}:${from.value}->${to.value}`,
          ).toBeCloseTo(sample, 9);
        }
      }
    }
  });

  it("compares every convertible source against the complete catalog", () => {
    for (const category of categories.filter(({ converter }) => converter !== "calculator")) {
      const sample = category.id === "temperature" ? 20 : 7.25;
      for (const from of category.units) {
        const results = convertAllExact(sample, from.value, category.id);
        expect(results.map(({ unit }) => unit.value), `${category.id}:${from.value}`).toEqual(
          category.units.map(({ value }) => value),
        );
        expect(results.find(({ unit }) => unit.value === from.value)?.value).toBe(sample);
      }
    }
  });

  it("rejects values outside physical domains with actionable errors", () => {
    const invalidCases = [
      [-273.151, "celsius", "kelvin", "temperature"],
      [-459.671, "fahrenheit", "kelvin", "temperature"],
      [-0.001, "kelvin", "celsius", "temperature"],
      [-273.151, "celsius", "celsius", "temperature"],
      [0, "liters_per_100km", "miles_per_gallon", "fuel"],
      [0, "liters_per_100km", "liters_per_100km", "fuel"],
      [-1, "miles_per_gallon", "liters_per_100km", "fuel"],
      [0, "minutes_per_kilometer", "minutes_per_mile", "pace"],
      [0, "minutes_per_kilometer", "minutes_per_kilometer", "pace"],
      [-1, "minutes_per_mile", "minutes_per_kilometer", "pace"],
    ] as const;

    for (const [value, from, to, category] of invalidCases) {
      try {
        convertExact(value, from, to, category);
        expect.fail(`${category}:${value} should be rejected`);
      } catch (error) {
        expect(error).toBeInstanceOf(ConversionError);
        expect((error as ConversionError).code).toBe("OUT_OF_DOMAIN");
        expect((error as Error).message).toMatch(/positive|absolute zero/i);
      }
    }
  });

  it("names ambiguous energy and power variants explicitly", () => {
    const energyLabels = categories.find(({ id }) => id === "energy")!.units.map(({ label }) => label);
    const powerLabels = categories.find(({ id }) => id === "power")!.units.map(({ label }) => label);

    expect(energyLabels).toContain("Calorie (thermochemical)");
    expect(energyLabels).toContain("Kilocalorie (food Calorie)");
    expect(energyLabels).toContain("BTU (International Table)");
    expect(powerLabels).toContain("Horsepower (mechanical)");
    expect(powerLabels).toContain("BTU/hour (International Table)");
  });

  it("preserves established default conversion pairs as the catalog grows", () => {
    const expected = {
      length: { from: "meters", to: "feet" },
      weight: { from: "kilograms", to: "pounds" },
      energy: { from: "joules", to: "kilowatt_hours" },
    } as const;
    for (const [categoryId, units] of Object.entries(expected)) {
      expect(defaultUnits(categories.find(({ id }) => id === categoryId)!)).toEqual(units);
    }
  });
});
