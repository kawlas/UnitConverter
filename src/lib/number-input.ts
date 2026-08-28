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

const MAX_EXPRESSION_TOKENS = 64;
const MAX_EXPRESSION_DEPTH = 40;
const MAX_EXPRESSION_INPUT_LENGTH = 128;

type ExpressionOp = "+" | "-" | "*" | "/";
type ExpressionToken =
  | { type: "number"; value: number }
  | { type: "op"; value: ExpressionOp }
  | { type: "lparen" }
  | { type: "rparen" };

const isExpressionLike = (value: string): boolean =>
  ["(", ")", "+", "*", "×", "÷"].some((character) => value.includes(character))
  || value.trim().slice(1).includes("-");

const localeDecimalSeparator = (locale: string): string =>
  usesDecimalPoint(locale) ? "." : ",";

const tokenizeExpression = (raw: string, locale: string): ExpressionToken[] | undefined => {
  const decimalSeparator = localeDecimalSeparator(locale);
  const tokens: ExpressionToken[] = [];
  let index = 0;

  while (index < raw.length) {
    const character = raw[index];
    if (/[ \t\n\r]/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }
    if (character === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }
    const op: ExpressionOp | undefined =
      character === "+" ? "+"
        : character === "-" ? "-"
          : character === "*" || character === "×" ? "*"
            : character === "/" || character === "÷" ? "/"
              : undefined;
    if (op) {
      tokens.push({ type: "op", value: op });
      index += 1;
      continue;
    }
    if (character === decimalSeparator || /\d/.test(character)) {
      const start = index;
      let separatorCount = 0;
      while (index < raw.length) {
        const next = raw[index];
        if (/\d/.test(next)) {
          index += 1;
        } else if (next === decimalSeparator && separatorCount === 0) {
          separatorCount += 1;
          index += 1;
        } else {
          break;
        }
      }
      let literal = raw.slice(start, index);
      if (separatorCount > 0) {
        if (usesDecimalPoint(locale)) {
          const segments = literal.split(".");
          if (segments.length !== 2 || segments[1] === "" || literal.split(",").length > 1) return undefined;
        } else {
          const segments = literal.split(",");
          if (segments.length !== 2 || segments[1] === "" || literal.includes(".")) return undefined;
          literal = `${segments[0]}.${segments[1]}`;
        }
      } else if (literal.includes(".") || literal.includes(",")) {
        return undefined;
      }
      const value = Number(literal);
      if (!Number.isFinite(value)) return undefined;
      tokens.push({ type: "number", value });
      continue;
    }
    return undefined;
  }
  return tokens;
};

class ExpressionParser {
  private readonly tokens: ExpressionToken[];
  private position = 0;
  private depth = 0;

  constructor(tokens: ExpressionToken[]) {
    this.tokens = tokens;
  }

  parse(): number | undefined {
    const value = this.parseExpression();
    if (value === undefined) return undefined;
    return this.position === this.tokens.length ? value : undefined;
  }

  private peek(): ExpressionToken | undefined {
    return this.tokens[this.position];
  }

  private next(): ExpressionToken | undefined {
    const token = this.tokens[this.position];
    if (token) this.position += 1;
    return token;
  }

  private parseExpression(): number | undefined {
    if (this.depth >= MAX_EXPRESSION_DEPTH) return undefined;
    this.depth += 1;
    let value = this.parseTerm();
    if (value === undefined) {
      this.depth -= 1;
      return undefined;
    }
    let consuming = true;
    while (consuming) {
      const token = this.peek();
      if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
        this.next();
        const rhs = this.parseTerm();
        if (rhs === undefined) {
          this.depth -= 1;
          return undefined;
        }
        value = token.value === "+" ? value + rhs : value - rhs;
      } else {
        consuming = false;
      }
    }
    this.depth -= 1;
    return Number.isFinite(value) ? value : undefined;
  }

  private parseTerm(): number | undefined {
    if (this.depth >= MAX_EXPRESSION_DEPTH) return undefined;
    this.depth += 1;
    let value = this.parseFactor();
    if (value === undefined) {
      this.depth -= 1;
      return undefined;
    }
    let consuming = true;
    while (consuming) {
      const token = this.peek();
      if (token?.type === "op" && (token.value === "*" || token.value === "/")) {
        this.next();
        const rhs = this.parseFactor();
        if (rhs === undefined) {
          this.depth -= 1;
          return undefined;
        }
        if (token.value === "/") {
          if (rhs === 0) {
            this.depth -= 1;
            return undefined;
          }
          value = value / rhs;
        } else {
          value = value * rhs;
        }
        if (!Number.isFinite(value)) {
          this.depth -= 1;
          return undefined;
        }
      } else {
        consuming = false;
      }
    }
    this.depth -= 1;
    return value;
  }

  private parseFactor(): number | undefined {
    const token = this.peek();
    if (!token) return undefined;
    if (token.type === "op" && (token.value === "+" || token.value === "-")) {
      this.next();
      const operand = this.parseFactor();
      if (operand === undefined) return undefined;
      return token.value === "-" ? -operand : operand;
    }
    if (token.type === "number") {
      this.next();
      return token.value;
    }
    if (token.type === "lparen") {
      this.next();
      const inner = this.parseExpression();
      if (inner === undefined) return undefined;
      if (this.peek()?.type !== "rparen") return undefined;
      this.next();
      return inner;
    }
    return undefined;
  }
}

const parseExpressionQuantity = (raw: string, locale: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EXPRESSION_INPUT_LENGTH) return undefined;
  const tokens = tokenizeExpression(trimmed, locale);
  if (!tokens || tokens.length === 0 || tokens.length > MAX_EXPRESSION_TOKENS) return undefined;
  const parser = new ExpressionParser(tokens);
  const result = parser.parse();
  return result === undefined ? undefined : Number.isFinite(result) ? result : undefined;
};

export const parseLocaleQuantity = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  if (!value) return undefined;

  if (isExpressionLike(value)) {
    const expression = parseExpressionQuantity(value, locale);
    if (expression !== undefined) return expression;
  }

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
