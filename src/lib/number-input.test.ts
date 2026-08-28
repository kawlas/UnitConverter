import { describe, expect, it } from "vitest";
import { parseLocaleQuantity } from "./number-input";

describe("locale-aware decimal and fraction input", () => {
  it.each([
    ["1,234.56", "en-US", 1234.56],
    ["1.234,56", "de-DE", 1234.56],
    ["12 345,67", "pl-PL", 12345.67],
    ["12\u202f345,67", "fr-FR", 12345.67],
    ["12,5", "pl-PL", 12.5],
    [".5", "en-US", 0.5],
    [",5", "fr-FR", 0.5],
  ])("parses %s in %s", (raw, locale, expected) => {
    expect(parseLocaleQuantity(raw, locale)).toBe(expected);
  });

  it.each([
    ["3/8", "en-US", 0.375],
    ["3 ⁄ 8", "de-DE", 0.375],
    ["1 1/2", "en-US", 1.5],
    ["-1 1/2", "pl-PL", -1.5],
    ["1,234 1/2", "en-US", 1234.5],
    ["1.234 1/2", "de-DE", 1234.5],
    ["12 345 1/2", "pl-PL", 12345.5],
    ["12\u202f345 1/2", "fr-FR", 12345.5],
    ["½", "fr-FR", 0.5],
    ["1½", "en-US", 1.5],
    ["-2 ⅝", "de-DE", -2.625],
    ["7/4", "en-US", 1.75],
  ])("parses fractional quantity %s in %s", (raw, locale, expected) => {
    expect(parseLocaleQuantity(raw, locale)).toBe(expected);
  });

  it.each([
    "1/0",
    "1 2/2",
    "1 3/2",
    "1 -1/2",
    "1/2/3",
    "1.5 1/2",
    "1e3",
    "NaN",
    "Infinity",
    "",
  ])("rejects unsafe or malformed quantity %s", (raw) => {
    expect(parseLocaleQuantity(raw, "en-US")).toBeUndefined();
  });

  it("keeps locale separator rules strict for decimal input", () => {
    expect(parseLocaleQuantity("1,2", "en-US")).toBeUndefined();
    expect(parseLocaleQuantity("1.2", "de-DE")).toBeUndefined();
    expect(parseLocaleQuantity("1,23,4", "en-US")).toBeUndefined();
    expect(parseLocaleQuantity("1 234.5", "en-US")).toBeUndefined();
    expect(parseLocaleQuantity("1.234,5", "pl-PL")).toBeUndefined();
  });
});
