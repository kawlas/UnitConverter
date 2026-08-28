import { describe, expect, it } from "vitest";
import { calculateAdultBmi, classifyAdultBmi } from "./bmi";

describe("adult BMI calculation", () => {
  it("returns an empty state before the user enters measurements", () => {
    expect(calculateAdultBmi("", "", "cm", "kg")).toEqual({ status: "empty" });
    expect(calculateAdultBmi("170", "", "cm", "kg")).toEqual({ status: "empty" });
    expect(calculateAdultBmi("", "70", "cm", "kg")).toEqual({ status: "empty" });
  });

  it("calculates metric and imperial inputs with the same formula", () => {
    const metric = calculateAdultBmi("170", "70", "cm", "kg");
    const imperial = calculateAdultBmi("66.9291338583", "154.323583529", "inches", "lbs");

    expect(metric).toMatchObject({ status: "ready", bmi: 24.2, category: "Healthy Weight" });
    expect(imperial).toMatchObject({ status: "ready", bmi: 24.2, category: "Healthy Weight" });
  });

  it("accepts comma decimals without accepting malformed values", () => {
    expect(calculateAdultBmi("170,5", "70,2", "cm", "kg")).toMatchObject({ status: "ready" });
    expect(calculateAdultBmi("170cm", "70", "cm", "kg")).toMatchObject({ status: "error" });
    expect(calculateAdultBmi("170", "1e3", "cm", "kg")).toMatchObject({ status: "error" });
  });

  it("rejects zero and negative measurements", () => {
    expect(calculateAdultBmi("0", "70", "cm", "kg")).toEqual({
      status: "error",
      message: "Height and weight must be greater than zero.",
    });
    expect(calculateAdultBmi("170", "-1", "cm", "kg")).toMatchObject({ status: "error" });
  });

  it("uses CDC adult screening category boundaries", () => {
    expect(classifyAdultBmi(18.49)).toBe("Underweight");
    expect(classifyAdultBmi(18.5)).toBe("Healthy Weight");
    expect(classifyAdultBmi(24.99)).toBe("Healthy Weight");
    expect(classifyAdultBmi(25)).toBe("Overweight");
    expect(classifyAdultBmi(29.99)).toBe("Overweight");
    expect(classifyAdultBmi(30)).toBe("Obesity");
  });

  it("returns the weight range corresponding to BMI 18.5–24.9", () => {
    expect(calculateAdultBmi("2", "80", "meters", "kg")).toMatchObject({
      status: "ready",
      referenceWeightKg: { min: 74, max: 99.6 },
    });
  });
});
