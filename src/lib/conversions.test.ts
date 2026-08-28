import { describe, expect, it } from "vitest";
import { ConversionError, convert, convertExact } from "./conversions";

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
});
