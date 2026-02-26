import { parseNaturalInput, type ParsedInput } from '../utils/naturalLanguageParser';

describe('parseNaturalInput', () => {
  // ── Pattern 1: "si X pour Y, combien pour Z" ──
  describe('Pattern: si...pour...combien pour', () => {
    it('parses basic "si X pour Y, combien pour Z"', () => {
      const result = parseNaturalInput('si 6 œufs pour 4 personnes, combien pour 7');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(6);
      expect(result!.item).toBe('œufs');
      expect(result!.base).toBe(4);
      expect(result!.baseUnit).toBe('personnes');
      expect(result!.target).toBe(7);
      expect(result!.confidence).toBe('high');
    });

    it('parses with question mark', () => {
      const result = parseNaturalInput('si 200g pour 4 personnes, combien pour 6 ?');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(200);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
      expect(result!.confidence).toBe('high');
    });

    it('parses with decimals (comma FR)', () => {
      const result = parseNaturalInput('si 2,5 kg pour 4, combien pour 10');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(2.5);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(10);
    });

    it('parses without units', () => {
      const result = parseNaturalInput('si 100 pour 5 combien pour 8');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(100);
      expect(result!.base).toBe(5);
      expect(result!.target).toBe(8);
    });
  });

  // ── Pattern 2: "combien de X pour Y si Z pour W" ──
  describe('Pattern: combien de...si...pour', () => {
    it('parses "combien de farine pour 8 si 200g pour 4"', () => {
      const result = parseNaturalInput('combien de farine pour 8 si 200g pour 4');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(200);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(8);
      expect(result!.confidence).toBe('high');
    });

    it('parses without "de"', () => {
      const result = parseNaturalInput('combien pour 6 si 300 pour 4');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(300);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
    });
  });

  // ── Pattern 3: Arrow ──
  describe('Pattern: arrow (→)', () => {
    it('parses "4 personnes → 7 personnes, 250g de beurre"', () => {
      const result = parseNaturalInput('4 personnes → 7 personnes, 250g de beurre');
      expect(result).not.toBeNull();
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(7);
      expect(result!.quantity).toBe(250);
      expect(result!.confidence).toBe('medium');
    });

    it('parses with -> arrow', () => {
      const result = parseNaturalInput('4 pers -> 6 pers, 100 ml');
      expect(result).not.toBeNull();
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
      expect(result!.quantity).toBe(100);
    });
  });

  // ── Pattern 4: Proportional "X pour Y = ? pour Z" ──
  describe('Pattern: proportional (X pour Y = ? pour Z)', () => {
    it('parses "200g pour 4 = ? pour 6"', () => {
      const result = parseNaturalInput('200g pour 4 = ? pour 6');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(200);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
      expect(result!.confidence).toBe('medium');
    });

    it('parses with comma separator', () => {
      const result = parseNaturalInput('300 pour 5, ? pour 8');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(300);
      expect(result!.base).toBe(5);
      expect(result!.target).toBe(8);
    });
  });

  // ── Pattern 5: Simple "X pour Y, pour Z" ──
  describe('Pattern: simple pour', () => {
    it('parses "6 œufs pour 4, pour 7"', () => {
      const result = parseNaturalInput('6 œufs pour 4, pour 7');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(6);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(7);
      expect(result!.confidence).toBe('medium');
    });

    it('parses "200g pour 4 pour 6"', () => {
      const result = parseNaturalInput('200g pour 4 pour 6');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(200);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
    });
  });

  // ── Fallback: 3 numbers ──
  describe('Fallback: extract 3 numbers', () => {
    it('extracts 3 numbers with low confidence', () => {
      const result = parseNaturalInput('j\'ai 200 grammes et 4 parts je veux 6');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(200);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(6);
      expect(result!.confidence).toBe('low');
    });

    it('returns null with only 2 numbers', () => {
      const result = parseNaturalInput('200 pour 4');
      // This should match patternSimplePour... no, it needs a third number
      // Actually patternSimplePour needs 3 numbers too. Let's check
      // "200 pour 4" — only 2 numbers, no third → fallback also fails
      expect(result).toBeNull();
    });
  });

  // ── Edge cases ──
  describe('Edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseNaturalInput('')).toBeNull();
    });

    it('returns null for whitespace only', () => {
      expect(parseNaturalInput('   ')).toBeNull();
    });

    it('returns null for text without numbers', () => {
      expect(parseNaturalInput('bonjour je veux des oeufs')).toBeNull();
    });

    it('handles fractions (1/2)', () => {
      const result = parseNaturalInput('si 1/2 pour 4, combien pour 8');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(0.5);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(8);
    });

    it('handles mixed case', () => {
      const result = parseNaturalInput('Si 6 OEUFS Pour 4, Combien Pour 7');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(6);
      expect(result!.base).toBe(4);
      expect(result!.target).toBe(7);
    });

    it('handles extra spaces', () => {
      const result = parseNaturalInput('  si   6   pour   4   combien   pour   7  ');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(6);
      expect(result!.target).toBe(7);
    });

    it('returns null for single number', () => {
      expect(parseNaturalInput('42')).toBeNull();
    });
  });

  // ── Number normalization ──
  describe('Number normalization', () => {
    it('handles decimal with dot', () => {
      const result = parseNaturalInput('si 2.5 pour 4, combien pour 8');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(2.5);
    });

    it('handles decimal with comma', () => {
      const result = parseNaturalInput('si 2,5 pour 4, combien pour 8');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(2.5);
    });

    it('handles fraction 3/4', () => {
      const result = parseNaturalInput('si 3/4 pour 2, combien pour 6');
      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(0.75);
    });
  });
});
