import { categories, getCategory, getUnit } from "./conversion-data";

export class ConversionError extends Error {
  readonly code: "INVALID_VALUE" | "OUT_OF_DOMAIN" | "UNKNOWN_CATEGORY" | "UNKNOWN_UNIT" | "UNSUPPORTED_CONVERSION" | "INVALID_RESULT";

  constructor(code: ConversionError["code"], message: string) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
  }
}

const assertFinite = (value: number): void => {
  if (!Number.isFinite(value)) {
    throw new ConversionError("INVALID_VALUE", "Enter a finite numeric value.");
  }
};

/** Strict, unrounded domain conversion. Formatting belongs to the UI. */
export const convertExact = (
  value: number,
  fromUnit: string,
  toUnit: string,
  categoryId: string,
): number => {
  assertFinite(value);
  const category = getCategory(categoryId);
  if (!category) {
    throw new ConversionError("UNKNOWN_CATEGORY", `Unknown category: ${categoryId}`);
  }

  const from = getUnit(category, fromUnit);
  const to = getUnit(category, toUnit);
  if (!from || !to) {
    throw new ConversionError("UNKNOWN_UNIT", "Select two units from the same category.");
  }
  if (category.converter === "calculator") {
    throw new ConversionError("UNSUPPORTED_CONVERSION", `${category.title} is a calculator, not a unit conversion.`);
  }
  const domainError = category.validateInput?.(value, from.value, to.value);
  if (domainError) {
    throw new ConversionError("OUT_OF_DOMAIN", domainError);
  }
  if (from.value === to.value) return value;

  let result: number;
  if (category.converter === "custom") {
    if (!category.convert) {
      throw new ConversionError("UNSUPPORTED_CONVERSION", `No conversion is defined for ${category.title}.`);
    }
    result = category.convert(value, from.value, to.value);
  } else if (from.kind === "affine" && to.kind === "affine") {
    result = to.fromBase!(from.toBase!(value));
  } else if (from.kind === "linear" && to.kind === "linear") {
    result = value * from.toBaseFactor! / to.toBaseFactor!;
  } else {
    throw new ConversionError("UNSUPPORTED_CONVERSION", "These units cannot be converted together.");
  }

  if (!Number.isFinite(result)) {
    throw new ConversionError("INVALID_RESULT", "The conversion result is outside the supported range.");
  }
  return result;
};

/** Backwards-compatible API. It validates strictly and rounds for legacy callers. */
export const convert = (
  value: number,
  fromUnit: string,
  toUnit: string,
  categoryId: string,
): number => Number(convertExact(value, fromUnit, toUnit, categoryId).toFixed(6));

// Compatibility adapter for legacy imports; the catalog remains the source of truth.
type ConversionFormulas = Record<string, Record<string, (value: number) => number>>;
export const conversionFormulas: ConversionFormulas = Object.fromEntries(
  categories
    .filter((category) => category.converter !== "calculator")
    .map((category) => [
      category.id,
      Object.fromEntries(
        category.units.flatMap((from) => category.units
          .filter((to) => to.value !== from.value)
          .map((to) => [
            `${from.value}_${to.value}`,
            (value: number) => convertExact(value, from.value, to.value, category.id),
          ])),
      ),
    ]),
);
