import { describe, expect, it } from "vitest";
import { ConversionError, convert, convertAllExact, convertExact } from "./conversions";

describe("central unit catalog conversions", () => {
  it("converts ares, square metres and hectares exactly", () => {
    expect(convertExact(1, "are", "square_meters", "area")).toBe(100);
    expect(convertExact(1, "are", "hectare", "area")).toBe(0.01);
    expect(convertExact(100, "square_meters", "are", "area")).toBe(1);
    expect(convertExact(1, "hectare", "are", "area")).toBe(100);
    expect(convertExact(1, "hectare", "square_meters", "area")).toBe(10_000);
  });

  it("resolves units by alias or symbol, case-insensitively", () => {
    expect(convertExact(1, "ar", "square_meters", "area")).toBe(100);
    expect(convertExact(1, "ha", "m2", "area")).toBe(10_000);
    expect(convertExact(1, "AR", "M2", "area")).toBe(100);
  });

  it("round-trips linear and affine units", () => {
    expect(convertExact(convertExact(3.5, "are", "square_meters", "area"), "square_meters", "are", "area")).toBeCloseTo(3.5);
    expect(convertExact(0, "celsius", "fahrenheit", "temperature")).toBe(32);
    expect(convertExact(-40, "celsius", "fahrenheit", "temperature")).toBe(-40);
    expect(convertExact(273.15, "kelvin", "celsius", "temperature")).toBeCloseTo(0);
  });

  it("supports practical additional categories", () => {
    expect(convertExact(1, "atmospheres", "pascals", "pressure")).toBe(101325);
    expect(convertExact(1, "megabytes", "bytes", "digital")).toBe(1_000_000);
    expect(convertExact(1, "hours", "minutes", "time")).toBe(60);
    expect(convertExact(180, "degrees", "radians", "angle")).toBeCloseTo(Math.PI);
    expect(convertExact(5, "minutes_per_kilometer", "minutes_per_mile", "pace")).toBeCloseTo(8.04672);
  });

  it("converts explicitly named US cooking measures and British stone", () => {
    expect(convertExact(1, "us_cups", "milliliters", "volume")).toBeCloseTo(236.5882365, 9);
    expect(convertExact(1, "us_cups", "us_fluid_ounces", "volume")).toBe(8);
    expect(convertExact(1, "us_tablespoons", "us_teaspoons", "volume")).toBe(3);
    expect(convertExact(1, "us_liquid_quarts", "us_cups", "volume")).toBe(4);
    expect(convertExact(1, "stone", "pounds", "weight")).toBe(14);
    expect(convertExact(1, "stone", "kilograms", "weight")).toBeCloseTo(6.35029318, 9);
  });

  it("keeps US and Imperial liquid measures distinct", () => {
    expect(convertExact(1, "gallons", "liters", "volume")).toBeCloseTo(3.785411784, 12);
    expect(convertExact(1, "imperial_gallons", "liters", "volume")).toBeCloseTo(4.54609, 12);
    expect(convertExact(1, "imperial_fluid_ounces", "milliliters", "volume")).toBeCloseTo(28.4130625, 10);
  });

  it("converts fuel economy with explicitly different US and UK gallons", () => {
    expect(convertExact(7, "liters_per_100km", "miles_per_gallon", "fuel")).toBeCloseTo(33.6020833, 7);
    expect(convertExact(7, "liters_per_100km", "miles_per_imperial_gallon", "fuel")).toBeCloseTo(40.354419476, 9);
    expect(convertExact(30, "miles_per_gallon", "miles_per_imperial_gallon", "fuel")).toBeCloseTo(36.028497765, 9);
  });

  it("prefers exact symbols and uses case-insensitive fallback only when unambiguous", () => {
    expect(convertExact(1, "kB", "B", "digital")).toBe(1000);
    expect(convertExact(1, "kb", "bit", "digital")).toBe(1000);
    expect(convertExact(1, "KiB", "B", "digital")).toBe(1024);
    expect(() => convertExact(1, "KB", "B", "digital")).toThrow(ConversionError);
    expect(convertExact(1, "ps", "watts", "power")).toBeCloseTo(735.49875);
  });

  it("rejects invalid values, categories, units and unsupported calculators", () => {
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      expect(() => convertExact(value, "are", "square_meters", "area")).toThrow(ConversionError);
    }
    expect(() => convertExact(1, "unknown", "are", "area")).toThrow(ConversionError);
    expect(() => convertExact(1, "are", "watts", "area")).toThrow(ConversionError);
    expect(() => convertExact(1, "metric", "imperial", "bmi")).toThrow(ConversionError);
    expect(() => convertExact(1, "are", "square_meters", "missing")).toThrow(ConversionError);
  });

  it("keeps the legacy rounded API while never silently falling back", () => {
    expect(convert(1 / 3, "kilometers", "meters", "length")).toBe(333.333333);
    expect(() => convert(2, "are", "watts", "area")).toThrow();
  });

  it("converts one value to every supported unit in catalog order", () => {
    const results = convertAllExact(1, "meters", "length");

    expect(results.map(({ unit }) => unit.value)).toEqual([
      "meters",
      "feet",
      "centimeters",
      "millimeters",
      "inches",
      "yards",
      "kilometers",
      "miles",
      "nautical_miles",
    ]);
    expect(results.find(({ unit }) => unit.value === "meters")?.value).toBe(1);
    expect(results.find(({ unit }) => unit.value === "feet")?.value).toBeCloseTo(3.280839895);
  });

  it("uses custom converters and preserves their input-domain validation", () => {
    expect(convertAllExact(7, "liters_per_100km", "fuel")).toEqual([
      expect.objectContaining({ unit: expect.objectContaining({ value: "liters_per_100km" }), value: 7 }),
      expect.objectContaining({ unit: expect.objectContaining({ value: "miles_per_gallon" }), value: expect.closeTo(33.6020832857) }),
      expect.objectContaining({ unit: expect.objectContaining({ value: "miles_per_imperial_gallon" }), value: expect.closeTo(40.354419544) }),
    ]);
    expect(() => convertAllExact(0, "liters_per_100km", "fuel")).toThrowError(/positive value/i);
  });

  it("rejects unknown units and calculators in compare-all mode", () => {
    expect(() => convertAllExact(1, "unknown", "length")).toThrow(ConversionError);
    expect(() => convertAllExact(1, "metric", "bmi")).toThrow(ConversionError);
  });
});
