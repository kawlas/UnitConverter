export interface FeetInchesHeight {
  readonly feet: number;
  readonly inches: number;
}

export type HeightInputResult =
  | { readonly status: "empty" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly value: number };

const CENTIMETERS_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

const assertNonNegativeFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite, non-negative number.`);
  }
};

export const parseHeightInput = (input: string): HeightInputResult => {
  const normalized = input.trim();
  if (!normalized) return { status: "empty" };
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(normalized)) {
    return {
      status: "error",
      message: normalized.startsWith("-")
        ? "Enter zero or a positive height."
        : "Enter a number only, such as 180 or 10.5.",
    };
  }
  const value = Number(normalized.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { status: "error", message: "Enter a smaller height." };
  }
  return { status: "ready", value };
};

export const centimetersToFeetInches = (centimeters: number): FeetInchesHeight => {
  assertNonNegativeFinite(centimeters, "Centimeters");
  const totalInches = centimeters / CENTIMETERS_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  return { feet, inches: totalInches - feet * INCHES_PER_FOOT };
};

export const feetInchesToCentimeters = (feet: number, inches: number): number => {
  assertNonNegativeFinite(feet, "Feet");
  assertNonNegativeFinite(inches, "Inches");
  if (!Number.isInteger(feet)) throw new Error("Feet must be a whole number.");
  if (inches >= INCHES_PER_FOOT) throw new Error("Inches must be less than 12.");
  return (feet * INCHES_PER_FOOT + inches) * CENTIMETERS_PER_INCH;
};

export const formatFeetInches = (
  centimeters: number,
  precision = 2,
  locale = "en-US",
): string => {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6) {
    throw new Error("Height precision must be a whole number from 0 to 6.");
  }
  const exact = centimetersToFeetInches(centimeters);
  const factor = 10 ** precision;
  let feet = exact.feet;
  let inches = Math.round((exact.inches + Number.EPSILON) * factor) / factor;
  if (inches >= INCHES_PER_FOOT) {
    feet += 1;
    inches = 0;
  }
  const formattedInches = new Intl.NumberFormat(locale, {
    maximumFractionDigits: precision,
  }).format(inches);
  return `${feet} ft ${formattedInches} in`;
};
