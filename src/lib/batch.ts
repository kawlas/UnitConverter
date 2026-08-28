import { ConversionError, convertExact } from "./conversions";
import { isFractionLike, parseLocaleQuantity } from "./number-input";

export const MAX_BATCH_INPUT_LENGTH = 4096;
export const MAX_BATCH_LINES = 100;
export const MAX_BATCH_LINE_LENGTH = 512;

export interface BatchSuccess {
  ok: true;
  input: string;
  value: number;
  formatted: string;
}

export interface BatchFailure {
  ok: false;
  input: string;
  error: string;
}

export type BatchLineResult = BatchSuccess | BatchFailure;

export interface BatchRejected {
  rejected: true;
  lines: [];
}

export interface BatchProcessed {
  rejected: false;
  lines: readonly BatchLineResult[];
  totalLines: number;
}

export type BatchConversionResult = BatchRejected | BatchProcessed;

const formatValue = (value: number, locale: string, precision: number): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: precision }).format(value);

const parseError = (line: string, locale: string): string =>
  isFractionLike(line)
    ? "Enter a valid fraction with a non-zero denominator (for example, 3/8 or 1 1/2)."
    : `Enter a valid finite number (for example, ${locale === "en-US" ? "12.5" : "12,5"}).`;

export const splitBatchInput = (raw: string): { lines: string[]; overLength: boolean; overLineCount: boolean } => {
  const overLength = raw.length > MAX_BATCH_INPUT_LENGTH;
  if (overLength) return { lines: [], overLength, overLineCount: false };
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  const overLineCount = lines.length > MAX_BATCH_LINES;
  return { lines: overLineCount ? [] : lines, overLength, overLineCount };
};

export const convertBatchLine = (
  line: string,
  fromUnit: string,
  toUnit: string,
  categoryId: string,
  locale: string,
  precision: number,
): BatchLineResult => {
  if (line.length > MAX_BATCH_LINE_LENGTH) {
    return { input: line, ok: false, error: `Line is too long (limit ${MAX_BATCH_LINE_LENGTH} characters).` };
  }
  const parsed = parseLocaleQuantity(line, locale);
  if (parsed === undefined) {
    return { input: line, ok: false, error: parseError(line, locale) };
  }
  try {
    const value = convertExact(parsed, fromUnit, toUnit, categoryId);
    return { input: line, ok: true, value, formatted: formatValue(value, locale, precision) };
  } catch (error) {
    const message = error instanceof ConversionError ? error.message : "Conversion failed.";
    return { input: line, ok: false, error: message };
  }
};

export const runBatchConversions = (
  raw: string,
  fromUnit: string,
  toUnit: string,
  categoryId: string,
  locale: string,
  precision: number,
): BatchConversionResult => {
  const { lines, overLength, overLineCount } = splitBatchInput(raw);
  if (overLength || overLineCount) {
    return { rejected: true, lines: [] };
  }
  return {
    rejected: false,
    lines: lines.map((line) => convertBatchLine(line, fromUnit, toUnit, categoryId, locale, precision)),
    totalLines: lines.length,
  };
};

export const buildBatchCopyText = (
  lines: readonly BatchLineResult[],
  fromLabel: string,
  toLabel: string,
): string =>
  lines
    .filter((line): line is BatchSuccess => line.ok === true)
    .map((line) => `${line.input} ${fromLabel} → ${line.formatted} ${toLabel}`)
    .join("\n");
