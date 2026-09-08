export type Operator = '+' | '-' | '*' | '/' | '%';

export const sanitizeExpression = (input: string): string => {
  const trimmed = input.replace(/[^0-9+\-*/().%\s]/g, '');
  return trimmed.replace(/\s+/g, ' ');
};

export const evaluateExpression = (expression: string): number => {
  const sanitized = sanitizeExpression(expression);
  try {
    const fn = new Function(`return ${sanitized}`);
    const result = fn();
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Invalid result');
    }
    return result;
  } catch {
    throw new Error('Invalid expression');
  }
};
