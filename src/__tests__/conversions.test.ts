import {
  convertWeight,
  convertVolume,
  convertTemperature,
  convert,
  roundConversion,
  getUnitsForCategory,
} from '../utils/conversions';

describe('convertWeight', () => {
  it('converts kg to g', () => {
    expect(convertWeight(1, 'kg', 'g')).toBe(1000);
  });
  it('converts lb to kg', () => {
    const result = convertWeight(1, 'lb', 'kg');
    expect(result).toBeCloseTo(0.453592, 4);
  });
  it('converts oz to g', () => {
    const result = convertWeight(1, 'oz', 'g');
    expect(result).toBeCloseTo(28.3495, 3);
  });
  it('same unit returns same value', () => {
    expect(convertWeight(500, 'g', 'g')).toBe(500);
  });
  it('returns null for unknown unit', () => {
    expect(convertWeight(1, 'invalid', 'g')).toBeNull();
  });
});

describe('convertVolume', () => {
  it('converts L to ml', () => {
    expect(convertVolume(1, 'L', 'ml')).toBe(1000);
  });
  it('converts cup to ml', () => {
    const result = convertVolume(1, 'cup', 'ml');
    expect(result).toBeCloseTo(236.588, 2);
  });
  it('converts cl to L', () => {
    expect(convertVolume(100, 'cl', 'L')).toBe(1);
  });
  it('converts c.à.s to ml', () => {
    expect(convertVolume(1, 'c.à.s', 'ml')).toBe(15);
  });
  it('converts c.à.c to ml', () => {
    expect(convertVolume(1, 'c.à.c', 'ml')).toBe(5);
  });
  it('converts fl oz to ml', () => {
    const result = convertVolume(1, 'fl oz', 'ml');
    expect(result).toBeCloseTo(29.5735, 3);
  });
});

describe('convertTemperature', () => {
  it('converts 0°C to 32°F', () => {
    expect(convertTemperature(0, '°C', '°F')).toBe(32);
  });
  it('converts 100°C to 212°F', () => {
    expect(convertTemperature(100, '°C', '°F')).toBe(212);
  });
  it('converts 32°F to 0°C', () => {
    expect(convertTemperature(32, '°F', '°C')).toBe(0);
  });
  it('converts 212°F to 100°C', () => {
    expect(convertTemperature(212, '°F', '°C')).toBe(100);
  });
  it('same unit returns same value', () => {
    expect(convertTemperature(50, '°C', '°C')).toBe(50);
  });
  it('returns null for unknown units', () => {
    expect(convertTemperature(50, '°K', '°C')).toBeNull();
  });
});

describe('convert', () => {
  it('delegates to weight', () => {
    expect(convert(1, 'kg', 'g', 'weight')).toBe(1000);
  });
  it('delegates to volume', () => {
    expect(convert(1, 'L', 'ml', 'volume')).toBe(1000);
  });
  it('delegates to temperature', () => {
    expect(convert(0, '°C', '°F', 'temperature')).toBe(32);
  });
});

describe('roundConversion', () => {
  it('rounds large values to integer', () => {
    expect(roundConversion(1234.567)).toBe('1235');
  });
  it('rounds medium values to 1 decimal', () => {
    expect(roundConversion(12.345)).toBe('12.3');
  });
  it('rounds small values to 2 decimals', () => {
    expect(roundConversion(0.456)).toBe('0.46');
  });
});

describe('getUnitsForCategory', () => {
  it('returns weight units', () => {
    const units = getUnitsForCategory('weight');
    expect(units.length).toBe(4);
    expect(units[0].id).toBe('g');
  });
  it('returns volume units', () => {
    const units = getUnitsForCategory('volume');
    expect(units.length).toBe(7);
  });
  it('returns temperature units', () => {
    const units = getUnitsForCategory('temperature');
    expect(units.length).toBe(2);
  });
});
