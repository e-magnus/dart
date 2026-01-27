const { isBust, isCheckout, addDartScore } = require('../gameLogic.js');

describe('Game rules - Edge cases and special scenarios', () => {
  describe('Bust detection', () => {
    test('detects negative score as bust', () => {
      expect(isBust(-10)).toBe(true);
    });

    test('detects score 1 as bust', () => {
      expect(isBust(1)).toBe(true);
    });

    test('score 0 is not a bust (valid checkout)', () => {
      expect(isBust(0)).toBe(false);
    });

    test('score 2+ is not a bust', () => {
      expect(isBust(2)).toBe(false);
      expect(isBust(50)).toBe(false);
      expect(isBust(100)).toBe(false);
    });
  });

  describe('Checkout validation', () => {
    test('score 0 is a valid checkout', () => {
      expect(isCheckout(0)).toBe(true);
    });

    test('non-zero scores are not checkouts', () => {
      expect(isCheckout(1)).toBe(false);
      expect(isCheckout(-1)).toBe(false);
      expect(isCheckout(50)).toBe(false);
    });
  });

  describe('Dart scoring edge cases', () => {
    test('bull (50) checkout', () => {
      const result = addDartScore(50, 50);
      expect(result.newScore).toBe(0);
      expect(result.isCheckout).toBe(true);
    });

    test('outer bull (25) checkout', () => {
      const result = addDartScore(25, 25);
      expect(result.newScore).toBe(0);
      expect(result.isCheckout).toBe(true);
    });

    test('overshooting causes bust', () => {
      const result = addDartScore(10, 20);
      expect(result.newScore).toBe(-10);
      expect(result.isBust).toBe(true);
    });

    test('leaving 1 causes bust', () => {
      const result = addDartScore(1, 0);
      expect(result.newScore).toBe(1);
      expect(result.isBust).toBe(true);
    });

    test('normal scoring is valid', () => {
      const result = addDartScore(501, 100);
      expect(result.newScore).toBe(401);
      expect(result.isBust).toBe(false);
      expect(result.isCheckout).toBe(false);
    });
  });
});
