import { describe, it, expect } from 'vitest';
import { evaluateExpression } from './calculator-parser';

describe('Calculator Parser & Security Tests', () => {
  describe('Basic Operations', () => {
    it('evaluates addition, subtraction, multiplication, division', () => {
      expect(evaluateExpression('2 + 3 * 4')).toBe(14);
      expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
      expect(evaluateExpression('10 - 4 / 2')).toBe(8);
      expect(evaluateExpression('10 / 4')).toBe(2.5);
    });

    it('handles negative numbers and decimals', () => {
      expect(evaluateExpression('-5 + 3')).toBe(-2);
      expect(evaluateExpression('0.1 + 0.2')).toBeCloseTo(0.3);
    });

    it('handles percentage operator', () => {
      expect(evaluateExpression('50 % 10')).toBe(0);
    });
  });

  describe('Security & Input Validation', () => {
    it('does not use Function or eval constructor', () => {
      const codeStr = evaluateExpression.toString();
      expect(codeStr).not.toContain('Function');
      expect(codeStr).not.toContain('eval');
    });

    it('rejects malicious JavaScript injection attempts', () => {
      expect(() => evaluateExpression('console.log("XSS")')).toThrow();
      expect(() => evaluateExpression('alert(1)')).toThrow();
      expect(() => evaluateExpression('window.location="http://evil.com"')).toThrow();
      expect(() => evaluateExpression('process.exit()')).toThrow();
    });

    it('throws on invalid syntax or mismatched parentheses', () => {
      expect(() => evaluateExpression('2 + +')).toThrow();
      expect(() => evaluateExpression('(2 + 3')).toThrow();
      expect(() => evaluateExpression('2 + 3)')).toThrow();
    });

    it('handles division by zero gracefully', () => {
      expect(() => evaluateExpression('1 / 0')).toThrow();
    });
  });
});
