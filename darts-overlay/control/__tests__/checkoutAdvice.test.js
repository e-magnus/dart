/** @jest-environment jsdom */

const { getCheckoutAdvice } = require('../checkoutAdvice.js');

describe('Gumma Lilla - Checkout Advice System', () => {
  describe('Valid checkout scores (2-170)', () => {
    test('returns advice for score 170 (max checkout)', () => {
      const advice = getCheckoutAdvice(170);
      expect(advice).not.toBeNull();
      expect(advice.tegund).toBe("Útgangur");
      expect(advice.maelt_med).toBe("T20, T20, DB");
    });

    test('returns advice for score 100 (common checkout)', () => {
      const advice = getCheckoutAdvice(100);
      expect(advice).not.toBeNull();
      expect(advice.tegund).toBe("Útgangur");
      expect(advice.maelt_med).toBe("T20, D20");
    });

    test('returns advice for score 2 (minimum checkout)', () => {
      const advice = getCheckoutAdvice(2);
      expect(advice).not.toBeNull();
      expect(advice.tegund).toBe("Útgangur");
      expect(advice.maelt_med).toBe("D1");
    });

    test('returns advice for bogey number 159', () => {
      const advice = getCheckoutAdvice(159);
      expect(advice).not.toBeNull();
      expect(advice.tegund).toBe("Uppsetning (bogey)");
      expect(advice.athugasemd).toContain("Uppsetning");
    });

    test('returns advice for bogey number 162', () => {
      const advice = getCheckoutAdvice(162);
      expect(advice).not.toBeNull();
      expect(advice.tegund).toBe("Uppsetning (bogey)");
    });
  });

  describe('Invalid scores', () => {
    test('returns null for score 0', () => {
      const advice = getCheckoutAdvice(0);
      expect(advice).toBeNull();
    });

    test('returns null for score 1', () => {
      const advice = getCheckoutAdvice(1);
      expect(advice).toBeNull();
    });

    test('returns null for score 171 (above max)', () => {
      const advice = getCheckoutAdvice(171);
      expect(advice).toBeNull();
    });

    test('returns null for score 200 (above max)', () => {
      const advice = getCheckoutAdvice(200);
      expect(advice).toBeNull();
    });

    test('returns null for negative score', () => {
      const advice = getCheckoutAdvice(-10);
      expect(advice).toBeNull();
    });
  });

  describe('Advice structure validation', () => {
    test('all valid scores have required fields', () => {
      for (let score = 2; score <= 170; score++) {
        const advice = getCheckoutAdvice(score);
        
        expect(advice).not.toBeNull();
        expect(advice).toHaveProperty('tegund');
        expect(advice).toHaveProperty('maelt_med');
        expect(advice).toHaveProperty('varaleid');
        expect(advice).toHaveProperty('athugasemd');
        
        // tegund should be either "Útgangur" or "Uppsetning (bogey)"
        expect(['Útgangur', 'Uppsetning (bogey)']).toContain(advice.tegund);
        
        // maelt_med should not be empty
        expect(advice.maelt_med).toBeTruthy();
        expect(typeof advice.maelt_med).toBe('string');
      }
    });

    test('bogey numbers are correctly identified', () => {
      const bogeyNumbers = [159, 162, 163, 165, 166, 168, 169];
      
      bogeyNumbers.forEach(score => {
        const advice = getCheckoutAdvice(score);
        expect(advice.tegund).toBe("Uppsetning (bogey)");
        expect(advice.athugasemd).toContain("Uppsetning");
      });
    });

    test('non-bogey numbers have "Útgangur" type', () => {
      const normalCheckouts = [50, 100, 120, 140, 160, 170];
      
      normalCheckouts.forEach(score => {
        const advice = getCheckoutAdvice(score);
        expect(advice.tegund).toBe("Útgangur");
      });
    });
  });

  describe('Common checkout paths', () => {
    test('32 checkout ends with D16', () => {
      const advice = getCheckoutAdvice(32);
      expect(advice.maelt_med).toContain('D16');
    });

    test('40 checkout is D20', () => {
      const advice = getCheckoutAdvice(40);
      expect(advice.maelt_med).toBe('D20');
    });

    test('50 checkout contains D20', () => {
      const advice = getCheckoutAdvice(50);
      expect(advice.maelt_med).toContain('D20');
    });

    test('110 checkout contains T19', () => {
      const advice = getCheckoutAdvice(110);
      expect(advice.maelt_med).toContain('T19');
    });
  });

  describe('Edge cases', () => {
    test('handles all scores 2-170 without gaps', () => {
      let missingScores = [];
      
      for (let score = 2; score <= 170; score++) {
        const advice = getCheckoutAdvice(score);
        if (!advice) {
          missingScores.push(score);
        }
      }
      
      expect(missingScores).toEqual([]);
    });
  });
});
