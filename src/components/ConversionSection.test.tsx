import { describe, expect, it } from "vitest";
import { SAVED_DATA_TTL_MS, buildPlaybackUrl, clearStoredData, parseStoredFavorites, parseStoredHistory, parseStrict } from "./ConversionSection";

describe("saved conversion playback URL", () => {
  it("includes the target category and complete history state", () => {
    expect(buildPlaybackUrl("weight", {
      from: "kilogram",
      to: "pound",
      value: "12.5",
      precision: "4",
      locale: "pl-PL",
    })).toBe("/convert/weight?from=kilogram&to=pound&value=12.5&precision=4&locale=pl-PL");
  });

  it("includes the target category and favorite units", () => {
    expect(buildPlaybackUrl("temperature", {
      from: "celsius",
      to: "fahrenheit",
    })).toBe("/convert/temperature?from=celsius&to=fahrenheit");
  });
});

describe("saved data controls", () => {
  it("removes both saved-data keys", () => {
    const removed: string[] = [];

    clearStoredData({ removeItem: (key) => removed.push(key) });

    expect(removed).toEqual(["q-converter:history:v1", "q-converter:favorites:v1"]);
  });
});

describe("localStorage payload validation", () => {
  const validHistoryEntry = (timestamp: number) => ({
    categoryId: "length",
    fromUnit: "meters",
    toUnit: "feet",
    input: "1",
    result: "3.28",
    precision: 2,
    locale: "en-US",
    timestamp,
  });

  it("keeps only valid history entries and caps retained history", () => {
    const entries = Array.from({ length: 52 }, (_, index) => validHistoryEntry(index + 1));
    entries[1] = { ...validHistoryEntry(2), locale: "invalid" };
    entries.push({ ...validHistoryEntry(53), precision: 13 });

    const parsed = parseStoredHistory(JSON.stringify(entries), SAVED_DATA_TTL_MS + 1);

    expect(parsed).toHaveLength(50);
    expect(parsed.every((entry) => entry.locale === "en-US" && entry.precision === 2)).toBe(true);
    expect(parsed[0].timestamp).toBe(1);
  });

  it("returns an empty history for malformed JSON or a non-array payload", () => {
    expect(parseStoredHistory("not-json")).toEqual([]);
    expect(parseStoredHistory(JSON.stringify({ categoryId: "length" }))).toEqual([]);
  });

  it("retains fresh history and discards expired entries", () => {
    const now = SAVED_DATA_TTL_MS * 2;
    const fresh = validHistoryEntry(now - SAVED_DATA_TTL_MS + 1);
    const expired = validHistoryEntry(now - SAVED_DATA_TTL_MS - 1);

    expect(parseStoredHistory(JSON.stringify([fresh, expired]), now)).toEqual([fresh]);
  });

  it("keeps only well-formed favorite IDs and caps retained favorites", () => {
    const favorites = Array.from({ length: 32 }, (_, index) => `category-${index}:from-${index}:to-${index}`);
    favorites[2] = "missing-unit-separator";
    favorites.push("length:meters:feet:extra");

    const parsed = parseStoredFavorites(JSON.stringify(favorites));

    expect(parsed).toHaveLength(30);
    expect(parsed).not.toContain("missing-unit-separator");
    expect(parsed.every((id) => id.split(":").length === 3)).toBe(true);
  });

  it("returns an empty favorites list for malformed JSON or a non-array payload", () => {
    expect(parseStoredFavorites("not-json")).toEqual([]);
    expect(parseStoredFavorites(JSON.stringify({ id: "length:meters:feet" }))).toEqual([]);
  });

  it("retains fresh favorites and discards expired or malformed timestamped entries", () => {
    const now = SAVED_DATA_TTL_MS * 2;
    const fresh = { id: "length:meters:feet", timestamp: now - SAVED_DATA_TTL_MS + 1 };
    const expired = { id: "weight:kilogram:pound", timestamp: now - SAVED_DATA_TTL_MS - 1 };
    const malformed = { id: "temperature:celsius:fahrenheit", timestamp: "yesterday" };

    expect(parseStoredFavorites(JSON.stringify([fresh, expired, malformed]), now)).toEqual([fresh.id]);
  });
});

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
