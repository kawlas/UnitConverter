import { describe, expect, it } from "vitest";
import { parseStrict } from "./ConversionSection";

describe("parseStrict locale grammar", () => {
  it("rejects malformed separators in en-US", () => {
    expect(parseStrict("1,2", "en-US")).toBeUndefined();
    expect(parseStrict(",5", "en-US")).toBeUndefined();
    expect(parseStrict("1,23", "en-US")).toBeUndefined();
    expect(parseStrict("1,234,56.7", "en-US")).toBeUndefined();
  });

  it("accepts valid en-US formats", () => {
    expect(parseStrict("1,234.56", "en-US")).toBe(1234.56);
    expect(parseStrict("1234.56", "en-US")).toBe(1234.56);
    expect(parseStrict("1,234,567", "en-US")).toBe(1234567);
    expect(parseStrict(".5", "en-US")).toBe(0.5);
    expect(parseStrict("-1,234.5", "en-US")).toBe(-1234.5);
  });

  it("mirrors the grammar for comma-decimal locales (de-DE)", () => {
    expect(parseStrict("1.234,56", "de-DE")).toBe(1234.56);
    expect(parseStrict("1234,56", "de-DE")).toBe(1234.56);
    expect(parseStrict("1,5", "de-DE")).toBe(1.5);
    expect(parseStrict(",5", "de-DE")).toBe(0.5);
    expect(parseStrict("1.2", "de-DE")).toBeUndefined();
    expect(parseStrict("1.23", "de-DE")).toBeUndefined();
    expect(parseStrict("1.2.345", "de-DE")).toBeUndefined();
  });

  it("keeps plain decimals working across locales and rejects garbage", () => {
    expect(parseStrict("12.5", "en-US")).toBe(12.5);
    expect(parseStrict("12,5", "pl-PL")).toBe(12.5);
    expect(parseStrict("0", "fr-FR")).toBe(0);
    expect(parseStrict("", "en-US")).toBeUndefined();
    expect(parseStrict("abc", "en-US")).toBeUndefined();
    expect(parseStrict("1e3", "en-US")).toBeUndefined();
  });
});
