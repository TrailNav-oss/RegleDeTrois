import { solveCrossMultiply, scaleIngredients, smartRound, adjustByIngredient } from '../utils/crossMultiply';

describe('solveCrossMultiply', () => {
  // A/B = C/X → A*X = B*C

  describe('X is unknown', () => {
    it('solves for X when A, B, C are provided', () => {
      // 2/4 = 3/X → X = (4*3)/2 = 6
      const result = solveCrossMultiply({ a: 2, b: 4, c: 3, x: null });
      expect(result).toEqual({ field: 'x', value: 6 });
    });

    it('handles decimal results', () => {
      // 3/7 = 5/X → X = (7*5)/3 = 11.666...
      const result = solveCrossMultiply({ a: 3, b: 7, c: 5, x: null });
      expect(result).toHaveProperty('field', 'x');
      if ('value' in result) {
        expect(result.value).toBeCloseTo(11.6667, 3);
      }
    });
  });

  describe('A is unknown', () => {
    it('solves for A when B, C, X are provided', () => {
      // A/4 = 3/6 → A = (4*3)/6 = 2
      const result = solveCrossMultiply({ a: null, b: 4, c: 3, x: 6 });
      expect(result).toEqual({ field: 'a', value: 2 });
    });
  });

  describe('B is unknown', () => {
    it('solves for B when A, C, X are provided', () => {
      // 2/B = 3/6 → B = (2*6)/3 = 4
      const result = solveCrossMultiply({ a: 2, b: null, c: 3, x: 6 });
      expect(result).toEqual({ field: 'b', value: 4 });
    });
  });

  describe('C is unknown', () => {
    it('solves for C when A, B, X are provided', () => {
      // 2/4 = C/6 → C = (2*6)/4 = 3
      const result = solveCrossMultiply({ a: 2, b: 4, c: null, x: 6 });
      expect(result).toEqual({ field: 'c', value: 3 });
    });
  });

  describe('division by zero', () => {
    it('returns error when A=0 and X is unknown', () => {
      const result = solveCrossMultiply({ a: 0, b: 4, c: 3, x: null });
      expect(result).toHaveProperty('error');
    });

    it('returns error when B=0 and C is unknown', () => {
      const result = solveCrossMultiply({ a: 2, b: 0, c: null, x: 6 });
      expect(result).toHaveProperty('error');
    });

    it('returns error when C=0 and B is unknown', () => {
      const result = solveCrossMultiply({ a: 2, b: null, c: 0, x: 6 });
      expect(result).toHaveProperty('error');
    });

    it('returns error when X=0 and A is unknown', () => {
      const result = solveCrossMultiply({ a: null, b: 4, c: 3, x: 0 });
      expect(result).toHaveProperty('error');
    });
  });

  describe('edge cases', () => {
    it('returns error when no field is null', () => {
      const result = solveCrossMultiply({ a: 1, b: 2, c: 3, x: 4 });
      expect(result).toHaveProperty('error');
    });

    it('returns error when more than one field is null', () => {
      const result = solveCrossMultiply({ a: null, b: null, c: 3, x: 4 });
      expect(result).toHaveProperty('error');
    });

    it('handles negative numbers', () => {
      // -2/4 = -3/X → X = (4*-3)/-2 = 6
      const result = solveCrossMultiply({ a: -2, b: 4, c: -3, x: null });
      expect(result).toEqual({ field: 'x', value: 6 });
    });

    it('handles very small numbers', () => {
      const result = solveCrossMultiply({ a: 0.001, b: 0.002, c: 0.003, x: null });
      expect(result).toHaveProperty('field', 'x');
      if ('value' in result) {
        expect(result.value).toBeCloseTo(0.006, 5);
      }
    });

    it('handles very large numbers', () => {
      const result = solveCrossMultiply({ a: 1000000, b: 2000000, c: 3000000, x: null });
      expect(result).toEqual({ field: 'x', value: 6000000 });
    });
  });
});

describe('scaleIngredients', () => {
  it('scales quantities proportionally', () => {
    const ingredients = [{ qty: 100 }, { qty: 200 }, { qty: 50 }];
    const result = scaleIngredients(ingredients, 4, 8);
    expect(result).toEqual([200, 400, 100]);
  });

  it('scales down', () => {
    const ingredients = [{ qty: 100 }, { qty: 200 }];
    const result = scaleIngredients(ingredients, 4, 2);
    expect(result).toEqual([50, 100]);
  });

  it('returns same values when portions unchanged', () => {
    const ingredients = [{ qty: 100 }, { qty: 200 }];
    const result = scaleIngredients(ingredients, 4, 4);
    expect(result).toEqual([100, 200]);
  });

  it('handles base portions of zero', () => {
    const ingredients = [{ qty: 100 }];
    const result = scaleIngredients(ingredients, 0, 4);
    expect(result).toEqual([0]);
  });

  it('handles new portions of zero', () => {
    const ingredients = [{ qty: 100 }];
    const result = scaleIngredients(ingredients, 4, 0);
    expect(result).toEqual([0]);
  });

  it('rounds to 2 decimal places', () => {
    const ingredients = [{ qty: 100 }];
    const result = scaleIngredients(ingredients, 3, 7);
    expect(result).toEqual([233.33]);
  });

  it('handles empty ingredients', () => {
    const result = scaleIngredients([], 4, 8);
    expect(result).toEqual([]);
  });
});

describe('smartRound', () => {
  it('rounds g to integer', () => {
    expect(smartRound(150.7, 'g')).toBe(151);
  });

  it('rounds kg to integer', () => {
    expect(smartRound(2.3, 'kg')).toBe(2);
  });

  it('rounds pièce to integer', () => {
    expect(smartRound(3.6, 'pièce')).toBe(4);
  });

  it('rounds ml to 1 decimal', () => {
    expect(smartRound(66.666, 'ml')).toBe(66.7);
  });

  it('rounds cl to 1 decimal', () => {
    expect(smartRound(33.333, 'cl')).toBe(33.3);
  });

  it('rounds L to 1 decimal', () => {
    expect(smartRound(1.567, 'L')).toBe(1.6);
  });

  it('rounds c.à.s to integer', () => {
    expect(smartRound(2.4, 'c.à.s')).toBe(2);
  });
});

describe('adjustByIngredient', () => {
  const baseIngredients = [
    { qty: 6, unit: 'pièce' },
    { qty: 300, unit: 'g' },
    { qty: 200, unit: 'ml' },
    { qty: 100, unit: 'g' },
  ];

  it('scales down when reducing an ingredient (3 eggs from 6)', () => {
    const result = adjustByIngredient(baseIngredients, 4, 0, 3);
    expect(result).not.toBeNull();
    expect(result!.ratio).toBe(0.5);
    expect(result!.quantities).toEqual([3, 150, 100, 50]);
    expect(result!.portions).toBe(2);
  });

  it('scales down with non-round ratio (100g flour from 300g)', () => {
    const result = adjustByIngredient(baseIngredients, 4, 1, 100);
    expect(result).not.toBeNull();
    expect(result!.ratio).toBeCloseTo(0.333, 2);
    expect(result!.quantities[0]).toBe(2);       // 6 * 0.333 → 2 (pièce → integer)
    expect(result!.quantities[2]).toBe(66.7);     // 200 * 0.333 → 66.7 (ml → 1 decimal)
    expect(result!.quantities[3]).toBe(33);       // 100 * 0.333 → 33 (g → integer)
    expect(result!.portions).toBe(1.3);
  });

  it('scales up (500g flour from 300g)', () => {
    const result = adjustByIngredient(baseIngredients, 4, 1, 500);
    expect(result).not.toBeNull();
    expect(result!.ratio).toBeCloseTo(1.667, 2);
    expect(result!.quantities[0]).toBe(10);       // 6 * 1.667 → 10 (pièce)
    expect(result!.quantities[2]).toBe(333.3);    // 200 * 1.667 → 333.3 (ml)
    expect(result!.portions).toBe(6.7);
  });

  it('returns null when base qty is 0', () => {
    const ings = [{ qty: 0, unit: 'g' }, { qty: 100, unit: 'g' }];
    expect(adjustByIngredient(ings, 4, 0, 50)).toBeNull();
  });

  it('returns null for negative input', () => {
    expect(adjustByIngredient(baseIngredients, 4, 0, -3)).toBeNull();
  });

  it('handles zero new qty (all zeros)', () => {
    const result = adjustByIngredient(baseIngredients, 4, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.ratio).toBe(0);
    expect(result!.quantities).toEqual([0, 0, 0, 0]);
    expect(result!.portions).toBe(0);
  });

  it('driver ingredient keeps exact input value', () => {
    const result = adjustByIngredient(baseIngredients, 4, 0, 5);
    expect(result!.quantities[0]).toBe(5); // exact, not rounded
  });
});
