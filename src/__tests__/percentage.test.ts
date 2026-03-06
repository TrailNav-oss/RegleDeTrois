import {
  percentOf,
  percentVariation,
  increaseByPercent,
  decreaseByPercent,
  whatPercent,
  roundPercent,
} from '../utils/percentage';

describe('percentOf', () => {
  it('calculates 15% of 200', () => {
    expect(percentOf(15, 200)).toBe(30);
  });
  it('calculates 50% of 80', () => {
    expect(percentOf(50, 80)).toBe(40);
  });
  it('handles 0%', () => {
    expect(percentOf(0, 100)).toBe(0);
  });
  it('handles 100%', () => {
    expect(percentOf(100, 250)).toBe(250);
  });
});

describe('percentVariation', () => {
  it('calculates variation from 80 to 100 = +25%', () => {
    expect(percentVariation(80, 100)).toBe(25);
  });
  it('calculates negative variation from 100 to 80 = -20%', () => {
    expect(percentVariation(100, 80)).toBe(-20);
  });
  it('returns error on division by zero', () => {
    expect(percentVariation(0, 50)).toEqual({ error: 'DIVISION_BY_ZERO' });
  });
  it('handles same value = 0%', () => {
    expect(percentVariation(50, 50)).toBe(0);
  });
});

describe('increaseByPercent', () => {
  it('increases 200 by 20% = 240', () => {
    expect(increaseByPercent(200, 20)).toBe(240);
  });
  it('increases by 0%', () => {
    expect(increaseByPercent(100, 0)).toBe(100);
  });
  it('increases by 100%', () => {
    expect(increaseByPercent(50, 100)).toBe(100);
  });
});

describe('decreaseByPercent', () => {
  it('decreases 200 by 20% = 160', () => {
    expect(decreaseByPercent(200, 20)).toBe(160);
  });
  it('decreases by 0%', () => {
    expect(decreaseByPercent(100, 0)).toBe(100);
  });
  it('decreases by 50%', () => {
    expect(decreaseByPercent(200, 50)).toBe(100);
  });
});

describe('whatPercent', () => {
  it('30 is 15% of 200', () => {
    expect(whatPercent(30, 200)).toBe(15);
  });
  it('50 is 50% of 100', () => {
    expect(whatPercent(50, 100)).toBe(50);
  });
  it('returns error on division by zero', () => {
    expect(whatPercent(10, 0)).toEqual({ error: 'DIVISION_BY_ZERO' });
  });
  it('handles 0 part', () => {
    expect(whatPercent(0, 100)).toBe(0);
  });
});

describe('roundPercent', () => {
  it('formats integer', () => {
    expect(roundPercent(25)).toBe('25');
  });
  it('formats decimal removing trailing zeros', () => {
    expect(roundPercent(33.3333)).toBe('33.3333');
  });
  it('formats clean decimal', () => {
    expect(roundPercent(12.5)).toBe('12.5');
  });
});
