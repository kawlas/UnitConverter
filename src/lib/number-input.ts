export const SUPPORTED_NUMBER_LOCALES = ["en-US", "pl-PL", "de-DE", "fr-FR"] as const;

export const VULGAR_FRACTION_CHARACTERS = "¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞";

const VULGAR_FRACTIONS: Readonly<Record<string, readonly [number, number]>> = {
  "¼": [1, 4],
  "½": [1, 2],
  "¾": [3, 4],
  "⅐": [1, 7],
  "⅑": [1, 9],
  "⅒": [1, 10],
  "⅓": [1, 3],
  "⅔": [2, 3],
  "⅕": [1, 5],
  "⅖": [2, 5],
  "⅗": [3, 5],
  "⅘": [4, 5],
  "⅙": [1, 6],
  "⅚": [5, 6],
  "⅛": [1, 8],
  "⅜": [3, 8],
  "⅝": [5, 8],
  "⅞": [7, 8],
};

const EN_US_NUMBER = /^-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)$/;
const COMMA_DECIMAL_NUMBER = /^-?(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?|,\d+)$/;
const SPACE_GROUPED_COMMA_DECIMAL_NUMBER = /^-?(?:(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:,\d+)?|,\d+)$/;
const EN_US_INTEGER = /^\d{1,3}(?:,\d{3})+$|^\d+$/;
const GROUPED_INTEGER = /^\d{1,3}(?:\.\d{3})+$|^\d+$/;
const SPACE_GROUPED_INTEGER = /^\d{1,3}(?:[ \u00a0\u202f]\d{3})+$|^\d+$/;

const usesDecimalPoint = (locale: string): boolean => locale === "en-US";
const usesSpaceGrouping = (locale: string): boolean => locale === "pl-PL" || locale === "fr-FR";

const parseUnsignedLocaleInteger = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  const pattern = usesDecimalPoint(locale)
    ? EN_US_INTEGER
    : usesSpaceGrouping(locale)
      ? SPACE_GROUPED_INTEGER
      : GROUPED_INTEGER;
  if (!pattern.test(value)) return undefined;
  const normalized = usesDecimalPoint(locale)
    ? value.replace(/,/g, "")
    : usesSpaceGrouping(locale)
      ? value.replace(/[ \u00a0\u202f]/g, "")
      : value.replace(/\./g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : undefined;
};

const parseSignedLocaleInteger = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const parsed = parseUnsignedLocaleInteger(unsigned, locale);
  return parsed === undefined ? undefined : negative ? -parsed : parsed;
};

const finiteFraction = (numerator: number, denominator: number): number | undefined => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : undefined;
};

const parseVulgarFraction = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  const fraction = VULGAR_FRACTIONS[value.charAt(value.length - 1)];
  if (!fraction) return undefined;

  const prefix = value.slice(0, -1).trim();
  const negative = prefix.startsWith("-");
  const unsignedWhole = negative ? prefix.slice(1).trim() : prefix;
  const whole = unsignedWhole ? parseUnsignedLocaleInteger(unsignedWhole, locale) : 0;
  if (whole === undefined) return undefined;
  const [numerator, denominator] = fraction;
  const result = whole + numerator / denominator;
  return negative ? -result : result;
};

const parseAsciiFraction = (raw: string, locale: string): number | undefined => {
  const value = raw.trim().replace(/⁄/g, "/");
  const mixed = value.match(/^(.+?)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = parseSignedLocaleInteger(mixed[1], locale);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (whole === undefined || denominator === 0 || numerator >= denominator) return undefined;
    const fraction = finiteFraction(numerator, denominator);
    if (fraction === undefined) return undefined;
    const negative = mixed[1].trim().startsWith("-");
    const result = Math.abs(whole) + fraction;
    return negative ? -result : result;
  }

  const fraction = value.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
  if (!fraction) return undefined;
  const numerator = Number(fraction[2]);
  const denominator = Number(fraction[3]);
  const result = finiteFraction(numerator, denominator);
  return result === undefined ? undefined : fraction[1] === "-" ? -result : result;
};

export const isFractionLike = (raw: string): boolean =>
  raw.includes("/") || raw.includes("⁄") || [...VULGAR_FRACTION_CHARACTERS].some((character) => raw.includes(character));

export const parseLocaleQuantity = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  if (!value) return undefined;

  if (isFractionLike(value)) {
    return parseVulgarFraction(value, locale) ?? parseAsciiFraction(value, locale);
  }

  const pattern = usesDecimalPoint(locale)
    ? EN_US_NUMBER
    : usesSpaceGrouping(locale)
      ? SPACE_GROUPED_COMMA_DECIMAL_NUMBER
      : COMMA_DECIMAL_NUMBER;
  if (!pattern.test(value)) return undefined;
  const normalized = usesDecimalPoint(locale)
    ? value.replace(/,/g, "")
    : usesSpaceGrouping(locale)
      ? value.replace(/[ \u00a0\u202f]/g, "").replace(",", ".")
      : value.replace(/\./g, "").replace(",", ".");
  const result = Number(normalized);
  return Number.isFinite(result) ? result : undefined;
};
