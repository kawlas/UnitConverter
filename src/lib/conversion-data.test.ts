import { describe, expect, it } from "vitest";
import { defaultUnits, getCategory } from "./conversion-data";

describe("default conversion units", () => {
  it("preserves the baseline speed defaults", () => {
    expect(defaultUnits(getCategory("speed")!)).toEqual({ from: "kph", to: "mph" });
  });

  it("preserves the baseline area defaults", () => {
    expect(defaultUnits(getCategory("area")!)).toEqual({ from: "square_meters", to: "square_feet" });
  });
});
