export interface ParseResult {
  value: number;
  error?: string;
}

export const sanitizeExpression = (input: string): string => {
  const trimmed = input.replace(/[^0-9+\-*/().%\s]/g, '');
  return trimmed.replace(/\s+/g, ' ');
};

export const evaluateExpression = (expression: string): number => {
  if (typeof expression !== 'string') {
    throw new Error('Invalid expression');
  }
  
  // First check: reject anything with letters, underscores, dollar signs, or function-like patterns
  if (/[a-zA-Z_$]/.test(expression)) {
    throw new Error('Invalid expression');
  }
  
  // Reject obvious function calls like alert(), console.log(), etc.
  if (/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(expression)) {
    throw new Error('Invalid expression');
  }
  
  const sanitized = sanitizeExpression(expression);
  if (!sanitized.trim()) {
    return 0;
  }

  try {
    const tokens = tokenize(sanitized);
    const parser = new SafeParser(tokens);
    const result = parser.parse();
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Invalid result');
    }
    return result;
  } catch {
    throw new Error('Invalid expression');
  }
};

class SafeParser {
  private tokens: string[];
  private pos = 0;

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  parse(): number {
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected token');
    }
    return result;
  }

  private peek(): string | undefined {
    return this.tokens[this.pos];
  }

  private consume(): string | undefined {
    return this.tokens[this.pos++];
  }

  private parseExpression(): number {
    let left = this.parseTerm();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.consume();
      const right = this.parseTerm();
      if (op === '+') left += right;
      else left -= right;
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    while (this.peek() === '*' || this.peek() === '/' || this.peek() === '%') {
      const op = this.consume();
      const right = this.parseFactor();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      }
      else if (op === '%') left %= right;
    }
    return left;
  }

  private parseFactor(): number {
    const token = this.consume();
    if (token === undefined) {
      throw new Error('Unexpected end of expression');
    }
    if (token === '+') {
      return this.parseFactor();
    }
    if (token === '-') {
      return -this.parseFactor();
    }
    if (token === '(') {
      const value = this.parseExpression();
      if (this.consume() !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return value;
    }
    const num = parseFloat(token);
    if (isNaN(num)) {
      throw new Error('Bad input');
    }
    return num;
  }
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if ('+-*/()%'.includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    throw new Error('Bad input');
  }
  return tokens;
}