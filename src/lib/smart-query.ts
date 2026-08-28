import { categories, type CategoryDefinition, type UnitDefinition } from "./conversion-data";
import { ConversionError, convertExact } from "./conversions";
import { isFractionLike, parseLocaleQuantity, VULGAR_FRACTION_CHARACTERS } from "./number-input";

interface UnitCandidate {
  readonly category: CategoryDefinition;
  readonly unit: UnitDefinition;
}

export interface SmartConversionSuccess {
  readonly status: "success";
  readonly categoryId: string;
  readonly categoryTitle: string;
  readonly from: string;
  readonly fromLabel: string;
  readonly fromSymbol: string;
  readonly to: string;
  readonly toLabel: string;
  readonly toSymbol: string;
  readonly value: number;
  readonly result: number;
  readonly inputDisplay?: string;
}

export type SmartConversionQuery = SmartConversionSuccess | {
  readonly status: "ambiguous" | "invalid";
  readonly message: string;
} | {
  readonly status: "no-match";
};

const singularWords: Readonly<Record<string, string>> = {
  calories: "calorie",
  feet: "foot",
  inches: "inch",
};

const exactSymbolAliases: Readonly<Record<string, readonly string[]>> = {
  bits: ["b"],
  celsius: ["C"],
  fahrenheit: ["F"],
};

const singularizePhrase = (value: string): string => value
  .split(" ")
  .map((word) => singularWords[word] ?? (word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
  .join(" ");

const normalizeUnitText = (value: string, preserveCase = false): string => {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/[.?!]+$/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");
  return preserveCase
    ? normalized
    : normalized.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US");
};

const searchableNames = (unit: UnitDefinition): readonly string[] => {
  const label = unit.label.replace(/\s*\([^)]*\)\s*$/, "");
  const values = [
    unit.value.replace(/_/g, " "),
    label,
    ...unit.aliases,
  ].flatMap((value) => [value, singularizePhrase(value)]);
  return [...new Set(values.map((value) => normalizeUnitText(value)).filter(Boolean))];
};

const symbolNames = (unit: UnitDefinition): readonly string[] => [
  unit.symbol,
  unit.symbol.startsWith("°") ? unit.symbol.slice(1) : "",
  ...(exactSymbolAliases[unit.value] ?? []),
].map((value) => normalizeUnitText(value, true)).filter(Boolean);

const unitCandidates: readonly UnitCandidate[] = categories
  .filter((category) => category.converter !== "calculator")
  .flatMap((category) => category.units.map((unit) => ({ category, unit })));

const resolveUnit = (rawUnit: string): readonly UnitCandidate[] => {
  const exact = normalizeUnitText(rawUnit, true);
  const exactSymbols = unitCandidates.filter(({ unit }) => symbolNames(unit).includes(exact));
  if (exactSymbols.length > 0) return exactSymbols;

  const folded = normalizeUnitText(rawUnit);
  return unitCandidates.filter(({ unit }) =>
    symbolNames(unit).some((symbol) => normalizeUnitText(symbol) === folded) || searchableNames(unit).includes(folded)
  );
};

const fractionToken = `(?:(?:\\d+\\s+)?\\d+\\s*[\\/⁄]\\s*\\d+|(?:\\d+\\s*)?[${VULGAR_FRACTION_CHARACTERS}])`;
const decimalToken = `(?:(?:\\d+(?:[.,]\\d*)?)|(?:[.,]\\d+))(?:e[+-]?\\d+)?`;
const queryPattern = new RegExp(`^(?:(?:convert|przelicz|zamień|zamien)\\s+|(?:ile\\s+(?:to|jest))\\s+)?([+-]?(?:${fractionToken}|${decimalToken}))\\s*(.+?)\\s+(?:to|in|into|as|na|w|=>|->|=|ile\\s+to)\\s+(.+?)\\s*\\??$`, "i");
const compoundFeetInchesPattern = new RegExp(
  `^(?:(?:convert|przelicz|zamień|zamien)\\s+|(?:ile\\s+(?:to|jest))\\s+)?(${decimalToken})\\s*(?:ft|feet|foot|['′])\\s*(${decimalToken})\\s*(?:in|inches|inch|["″])?\\s+(?:to|in|into|as|na|w|=>|->|=)\\s+(.+?)\\s*\\??$`,
  "i",
);

const looksLikeGroupedThousands = (value: string): boolean =>
  /^[+-]?[1-9]\d{0,2}[.,]\d{3}$/.test(value);

const serializeShareableValue = (value: number): string | undefined => {
  const text = String(value);
  if (!/[eE]/.test(text)) return text;

  const [coefficient, rawExponent] = text.toLowerCase().split("e");
  const sign = coefficient.startsWith("-") ? "-" : "";
  const unsigned = coefficient.replace(/^[+-]/, "");
  const decimalIndex = (unsigned.includes(".") ? unsigned.indexOf(".") : unsigned.length) + Number(rawExponent);
  const digits = unsigned.replace(".", "");
  const expanded = decimalIndex <= 0
    ? `${sign}0.${"0".repeat(-decimalIndex)}${digits}`
    : decimalIndex >= digits.length
      ? `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`
      : `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  return expanded.length <= 120 ? expanded : undefined;
};

export const parseSmartConversionQuery = (query: string): SmartConversionQuery => {
  const compoundMatch = query.trim().match(compoundFeetInchesPattern);
  if (compoundMatch) {
    const feet = Number(compoundMatch[1].replace(",", "."));
    const inches = Number(compoundMatch[2].replace(",", "."));
    if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0 || inches >= 12) {
      return { status: "invalid", message: "Use a positive height with inches from 0 to less than 12." };
    }
    const parsed = parseSmartConversionQuery(`${feet * 12 + inches} inches to ${compoundMatch[3]}`);
    return parsed.status === "success"
      ? { ...parsed, inputDisplay: `${compoundMatch[1]} ft ${compoundMatch[2]} in` }
      : parsed;
  }

  const match = query.trim().match(queryPattern);
  if (!match) return { status: "no-match" };

  if (looksLikeGroupedThousands(match[1])) {
    return {
      status: "invalid",
      message: "Use digits without thousands separators, for example 1000. Use a comma only as a decimal separator, for example 2,5.",
    };
  }

  const value = isFractionLike(match[1])
    ? parseLocaleQuantity(match[1], "en-US")
    : Number(match[1].replace(",", "."));
  if (value === undefined || !Number.isFinite(value)) {
    return {
      status: "invalid",
      message: isFractionLike(match[1])
        ? "Enter a valid fraction with a non-zero denominator."
        : "Enter a finite numeric value.",
    };
  }
  if (!serializeShareableValue(value)) {
    return { status: "invalid", message: "That number is outside the supported shareable input range." };
  }

  const fromCandidates = resolveUnit(match[2]);
  const toCandidates = resolveUnit(match[3]);
  if (fromCandidates.length === 0) {
    return { status: "invalid", message: `We couldn't match the source unit “${match[2]}”.` };
  }
  if (toCandidates.length === 0) {
    return { status: "invalid", message: `We couldn't match the target unit “${match[3]}”.` };
  }

  const compatiblePairs = fromCandidates.flatMap((from) => toCandidates
    .filter((to) => to.category.id === from.category.id)
    .map((to) => ({ from, to })));

  if (compatiblePairs.length === 0) {
    return { status: "invalid", message: "Choose source and target units from the same category." };
  }
  if (compatiblePairs.length > 1) {
    return {
      status: "ambiguous",
      message: "That unit abbreviation is ambiguous. Check its capitalization or use the full unit name.",
    };
  }

  const [{ from, to }] = compatiblePairs;
  try {
    return {
      status: "success",
      categoryId: from.category.id,
      categoryTitle: from.category.title,
      from: from.unit.value,
      fromLabel: from.unit.label,
      fromSymbol: from.unit.symbol,
      to: to.unit.value,
      toLabel: to.unit.label,
      toSymbol: to.unit.symbol,
      value,
      result: convertExact(value, from.unit.value, to.unit.value, from.category.id),
    };
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof ConversionError ? error.message : "This conversion could not be completed.",
    };
  }
};

export const buildSmartConversionUrl = (conversion: SmartConversionSuccess): string => {
  const value = serializeShareableValue(conversion.value);
  if (!value) throw new Error("Smart conversion value is not shareable.");
  const params = new URLSearchParams({
    from: conversion.from,
    to: conversion.to,
    value,
  });
  return `/${conversion.categoryId}?${params.toString()}`;
};
