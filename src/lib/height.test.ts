import { describe, expect, it } from "vitest";
import {
  centimetersToFeetInches,
  feetInchesToCentimeters,
  formatFeetInches,
  parseHeightInput,
} from "./height";

describe("human height conversion", () => {
  it("converts centimeters to exact feet plus remaining inches", () => {
    expect(centimetersToFeetInches(180)).toMatchObject({
      feet: 5,
      inches: expect.closeTo(10.8661417323),
    });
    expect(formatFeetInches(180, 2, "en-US")).toBe("5 ft 10.87 in");
  });

  it("carries a rounded twelve-inch remainder into the next foot", () => {
    expect(formatFeetInches(182.87746, 2, "en-US")).toBe("6 ft 0 in");
  });

  it("converts feet and inches back to centimeters using the exact inch", () => {
    expect(feetInchesToCentimeters(5, 11)).toBeCloseTo(180.34, 12);
    expect(feetInchesToCentimeters(6, 0)).toBeCloseTo(182.88, 12);
  });

  it("accepts practical decimal input and fails closed on invalid heights", () => {
    expect(parseHeightInput(" 180,5 ")).toEqual({ status: "ready", value: 180.5 });
    expect(parseHeightInput("")).toEqual({ status: "empty" });
    expect(parseHeightInput("-1")).toMatchObject({ status: "error" });
    expect(parseHeightInput("five")).toMatchObject({ status: "error" });
    expect(() => feetInchesToCentimeters(5, 12)).toThrow(/less than 12/i);
    expect(() => centimetersToFeetInches(-1)).toThrow(/non-negative/i);
  });
});
