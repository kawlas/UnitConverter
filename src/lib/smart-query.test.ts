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
    ["1 1/2 cups to ml", "volume", "us_cups", "milliliters", 1.5, 354.88235475],
    ["2 tbsp to teaspoons", "volume", "us_tablespoons", "us_teaspoons", 2, 6],
    ["12 stone to kg", "weight", "stone", "kilograms", 12, 76.20351816],
    ["ile to 10 kg na gramy", "weight", "kilograms", "grams", 10, 10000],
    ["zamień 5ha na metry kwadratowe", "area", "hectare", "square_meters", 5, 50000],
    ["przelicz 7 l/100km na mpg", "fuel", "liters_per_100km", "miles_per_gallon", 7, 33.6020832857],
    ["7 l/100km to mpg UK", "fuel", "liters_per_100km", "miles_per_imperial_gallon", 7, 40.3544195],
    ["1 imperial gallon to liters", "volume", "imperial_gallons", "liters", 1, 4.54609],
    ["5 ft 11 in to cm", "length", "inches", "centimeters", 71, 180.34],
    ["5'11\" in cm", "length", "inches", "centimeters", 71, 180.34],
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

  it.each([
    ["10 cm in Zoll", "length", "centimeters", "inches", 10, 3.937007874],
    ["5 kg in englische Pfund", "weight", "kilograms", "pounds", 5, 11.0231131092],
    ["2 Hektar in Quadratmeter", "area", "hectare", "square_meters", 2, 20000],
    ["10 cm en pouces", "length", "centimeters", "inches", 10, 3.937007874],
    ["2 hectares en mètres carrés", "area", "hectare", "square_meters", 2, 20000],
    ["rechne 10 cm in Zoll", "length", "centimeters", "inches", 10, 3.937007874],
    ["convertir 5 kg en livres anglaises", "weight", "kilograms", "pounds", 5, 11.0231131092],
  ])("parses localized query %s", (query, categoryId, from, to, value, result) => {
    expect(parseSmartConversionQuery(query)).toMatchObject({
      status: "success",
      categoryId,
      from,
      to,
      value,
      result: expect.closeTo(result),
    });
  });

  it.each(["5 kg in Pfund", "5 kg en livres"])("clarifies culturally ambiguous unit %s", (query) => {
    expect(parseSmartConversionQuery(query)).toMatchObject({
      status: "ambiguous",
      message: expect.stringMatching(/500 g|international|lb/i),
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

  it("rejects malformed compound heights instead of silently carrying inches", () => {
    expect(parseSmartConversionQuery("5 ft 12 in to cm")).toMatchObject({
      status: "invalid",
      message: expect.stringMatching(/less than 12/i),
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

  it("answers metric height queries in feet and inches without mental arithmetic", () => {
    const parsed = parseSmartConversionQuery("180 cm in feet and inches");
    expect(parsed).toMatchObject({
      status: "success",
      categoryId: "height",
      inputDisplay: "180 cm",
      resultDisplay: "5 ft 10.87 in",
    });
    if (parsed.status !== "success") return;
    expect(buildSmartConversionUrl(parsed)).toBe(
      "/height?direction=cm-to-feet-inches&cm=180&precision=2",
    );
  });

  it("keeps an explicit decimal-feet query in the standard length converter", () => {
    const parsed = parseSmartConversionQuery("180 cm to feet");
    expect(parsed).toMatchObject({
      status: "success",
      categoryId: "length",
      from: "centimeters",
      to: "feet",
    });
    if (parsed.status !== "success") return;
    expect(buildSmartConversionUrl(parsed)).toBe(
      "/length?from=centimeters&to=feet&value=180",
    );
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
