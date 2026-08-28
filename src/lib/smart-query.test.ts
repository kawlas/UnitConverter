import { describe, expect, it } from "vitest";
import { buildSmartConversionUrl, parseSmartConversionQuery } from "./smart-query";
import { categories } from "./conversion-data";

describe("deterministic smart conversion queries", () => {
  it.each([
    ["5 ft to cm", "length", "feet", "centimeters", 5, 152.4],
    ["5ft to cm", "length", "feet", "centimeters", 5, 152.4],
    ["convert 100 C in F", "temperature", "celsius", "fahrenheit", 100, 212],
    ["2,5 kilograms into pounds", "weight", "kilograms", "pounds", 2.5, 5.5115565546],
    ["1e3 meters to kilometers", "length", "meters", "kilometers", 1000, 1],
    ["1 MB to kb", "digital", "megabytes", "kilobits", 1, 8000],
    ["1 kB to B", "digital", "kilobytes", "bytes", 1, 1000],
    ["8 b to B", "digital", "bits", "bytes", 8, 1],
    ["12 inches as cm", "length", "inches", "centimeters", 12, 30.48],
    ["1 square meter to sq ft", "area", "square_meters", "square_feet", 1, 10.7639104167],
    ["1/2 inch to cm", "length", "inches", "centimeters", 0.5, 1.27],
    ["1 1/2 ft to cm", "length", "feet", "centimeters", 1.5, 45.72],
    ["½ liter to ml", "volume", "liters", "milliliters", 0.5, 500],
  ])("parses %s using the catalog", (query, categoryId, from, to, value, result) => {
    expect(parseSmartConversionQuery(query)).toMatchObject({
      status: "success",
      categoryId,
      from,
      to,
      value,
      result: expect.closeTo(result),
    });
  });

  it("preserves case-sensitive digital symbols and rejects ambiguous casing", () => {
    expect(parseSmartConversionQuery("1 KB to B")).toMatchObject({
      status: "ambiguous",
      message: expect.stringMatching(/capitalization/i),
    });
  });

  it("explains unknown, incompatible and out-of-domain queries", () => {
    expect(parseSmartConversionQuery("5 mystery to cm")).toMatchObject({ status: "invalid", message: expect.stringMatching(/source unit/i) });
    expect(parseSmartConversionQuery("5 m to kg")).toMatchObject({ status: "invalid", message: expect.stringMatching(/same category/i) });
    expect(parseSmartConversionQuery("-500 C to F")).toMatchObject({ status: "invalid", message: expect.stringMatching(/absolute zero/i) });
    expect(parseSmartConversionQuery("0 L/100km to mpg")).toMatchObject({ status: "invalid", message: expect.stringMatching(/positive/i) });
    expect(parseSmartConversionQuery("1e-150 m to cm")).toMatchObject({ status: "invalid", message: expect.stringMatching(/shareable input range/i) });
    expect(parseSmartConversionQuery("1/0 m to cm")).toMatchObject({ status: "invalid", message: expect.stringMatching(/fraction|denominator/i) });
  });

  it.each(["1,000 ft to cm", "1.000 ft to cm"])("rejects the ambiguous grouped number %s", (query) => {
    expect(parseSmartConversionQuery(query)).toMatchObject({
      status: "invalid",
      message: expect.stringMatching(/without thousands separators/i),
    });
  });

  it("does not treat ordinary category searches as conversion queries", () => {
    expect(parseSmartConversionQuery("length")).toEqual({ status: "no-match" });
    expect(parseSmartConversionQuery("5 meters")).toEqual({ status: "no-match" });
  });

  it("builds a canonical, shareable converter URL", () => {
    const parsed = parseSmartConversionQuery("5 ft to cm");
    expect(parsed.status).toBe("success");
    if (parsed.status !== "success") return;
    expect(buildSmartConversionUrl(parsed)).toBe("/length?from=feet&to=centimeters&value=5");
  });

  it("resolves every published non-calculator example through catalog names", () => {
    for (const category of categories.filter(({ converter }) => converter !== "calculator")) {
      const example = category.examples[0];
      const query = `${example.input} ${example.from.replace(/_/g, " ")} to ${example.to.replace(/_/g, " ")}`;
      expect(parseSmartConversionQuery(query), query).toMatchObject({
        status: "success",
        categoryId: category.id,
        from: example.from,
        to: example.to,
      });
    }
  });
});
