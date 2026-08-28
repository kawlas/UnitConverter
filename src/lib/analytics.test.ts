import { describe, expect, it } from "vitest";
import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_CONSENT_TTL_MS,
  canonicalizeAnalyticsPath,
  readAnalyticsConsent,
  sanitizeAnalyticsDimension,
  sanitizePageLocation,
  writeAnalyticsConsent,
} from "./analytics";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("privacy-safe analytics", () => {
  it("removes query strings and fragments from page locations", () => {
    expect(sanitizePageLocation("https://qconverter.netlify.app/bmi?height=180&weight=80#result")).toBe(
      "https://qconverter.netlify.app/bmi",
    );
    expect(sanitizePageLocation("https://qconverter.netlify.app/length?from=meters&to=feet&value=1")).toBe(
      "https://qconverter.netlify.app/length",
    );
  });

  it("rejects non-http locations instead of forwarding arbitrary data", () => {
    expect(sanitizePageLocation("javascript:alert(1)")).toBe("");
    expect(sanitizePageLocation("not a url")).toBe("");
  });

  it("groups the legacy converter alias under its canonical path", () => {
    expect(canonicalizeAnalyticsPath("/convert/length")).toBe("/length");
    expect(canonicalizeAnalyticsPath("/length/meters-to-feet")).toBe("/length/meters-to-feet");
  });

  it("accepts only bounded machine identifiers for product-event dimensions", () => {
    expect(sanitizeAnalyticsDimension("digital_data")).toBe("digital_data");
    expect(sanitizeAnalyticsDimension("length?value=private")).toBe("");
    expect(sanitizeAnalyticsDimension("12.5 ft to cm")).toBe("");
    expect(sanitizeAnalyticsDimension("a".repeat(33))).toBe("");
  });

  it("only accepts known, versioned consent values", () => {
    const storage = new MemoryStorage();
    const now = 1_800_000_000_000;
    expect(readAnalyticsConsent(storage)).toBe("unset");

    storage.setItem(ANALYTICS_CONSENT_KEY, "unexpected");
    expect(readAnalyticsConsent(storage)).toBe("unset");

    writeAnalyticsConsent("accepted", storage, now);
    expect(readAnalyticsConsent(storage, now)).toBe("accepted");

    writeAnalyticsConsent("declined", storage, now);
    expect(readAnalyticsConsent(storage, now)).toBe("declined");
    expect(readAnalyticsConsent(storage, now + ANALYTICS_CONSENT_TTL_MS + 1)).toBe("unset");
  });

  it("fails closed when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readAnalyticsConsent(storage)).toBe("unset");
    expect(() => writeAnalyticsConsent("accepted", storage)).not.toThrow();
  });
});
