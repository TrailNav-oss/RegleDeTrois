export type ConversionCategory = 'weight' | 'volume' | 'temperature';

export interface ConversionUnit {
  id: string;
  label: string;
  category: ConversionCategory;
}

// ── Poids ──────────────────────────────────────────────
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

// ── Volumes ────────────────────────────────────────────
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  cl: 10,
  L: 1000,
  'fl oz': 29.5735,
  cup: 236.588,
  'c.à.s': 15,
  'c.à.c': 5,
};

// ── Unités disponibles ─────────────────────────────────
export const WEIGHT_UNITS: ConversionUnit[] = [
  { id: 'g', label: 'g', category: 'weight' },
  { id: 'kg', label: 'kg', category: 'weight' },
  { id: 'oz', label: 'oz', category: 'weight' },
  { id: 'lb', label: 'lb', category: 'weight' },
];

export const VOLUME_UNITS: ConversionUnit[] = [
  { id: 'ml', label: 'ml', category: 'volume' },
  { id: 'cl', label: 'cl', category: 'volume' },
  { id: 'L', label: 'L', category: 'volume' },
  { id: 'fl oz', label: 'fl oz', category: 'volume' },
  { id: 'cup', label: 'cup', category: 'volume' },
  { id: 'c.à.s', label: 'c.à.s', category: 'volume' },
  { id: 'c.à.c', label: 'c.à.c', category: 'volume' },
];

export const TEMPERATURE_UNITS: ConversionUnit[] = [
  { id: '°C', label: '°C', category: 'temperature' },
  { id: '°F', label: '°F', category: 'temperature' },
];

/**
 * Convertit une valeur d'une unité de poids à une autre
 */
export function convertWeight(value: number, from: string, to: string): number | null {
  const fromFactor = WEIGHT_TO_GRAMS[from];
  const toFactor = WEIGHT_TO_GRAMS[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  const result = (value * fromFactor) / toFactor;
  return isFinite(result) ? result : null;
}

/**
 * Convertit une valeur d'une unité de volume à une autre
 */
export function convertVolume(value: number, from: string, to: string): number | null {
  const fromFactor = VOLUME_TO_ML[from];
  const toFactor = VOLUME_TO_ML[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  const result = (value * fromFactor) / toFactor;
  return isFinite(result) ? result : null;
}

/**
 * Convertit une température
 */
export function convertTemperature(value: number, from: string, to: string): number | null {
  let result: number | null = null;
  if (from === to) result = value;
  else if (from === '°C' && to === '°F') result = (value * 9) / 5 + 32;
  else if (from === '°F' && to === '°C') result = ((value - 32) * 5) / 9;
  return result !== null && isFinite(result) ? result : null;
}

/**
 * Conversion générique selon la catégorie
 */
export function convert(value: number, from: string, to: string, category: ConversionCategory): number | null {
  switch (category) {
    case 'weight': return convertWeight(value, from, to);
    case 'volume': return convertVolume(value, from, to);
    case 'temperature': return convertTemperature(value, from, to);
  }
}

/**
 * Arrondi intelligent pour les conversions
 */
export function roundConversion(value: number): string {
  if (Math.abs(value) >= 100) return Math.round(value).toString();
  if (Math.abs(value) >= 1) return (Math.round(value * 10) / 10).toString();
  return (Math.round(value * 100) / 100).toString();
}

/**
 * Unités par catégorie
 */
export function getUnitsForCategory(category: ConversionCategory): ConversionUnit[] {
  switch (category) {
    case 'weight': return WEIGHT_UNITS;
    case 'volume': return VOLUME_UNITS;
    case 'temperature': return TEMPERATURE_UNITS;
  }
}
