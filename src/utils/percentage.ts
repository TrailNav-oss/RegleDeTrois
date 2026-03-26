/**
 * Calcule X% d'un nombre
 * Ex : 15% de 200 = 30
 */
export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

/**
 * Variation en pourcentage de oldValue à newValue
 * Ex : de 80 à 100 → +25%
 */
export function percentVariation(oldValue: number, newValue: number): number | { error: string } {
  if (oldValue === 0) return { error: 'DIVISION_BY_ZERO' };
  const result = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  if (!isFinite(result)) return { error: 'INVALID_RESULT' };
  return result;
}

/**
 * Augmenter une valeur de X%
 * Ex : 200 + 20% = 240
 */
export function increaseByPercent(value: number, percent: number): number {
  return value * (1 + percent / 100);
}

/**
 * Diminuer une valeur de X%
 * Ex : 200 - 20% = 160
 */
export function decreaseByPercent(value: number, percent: number): number {
  return value * (1 - percent / 100);
}

/**
 * X est quel % de Y ?
 * Ex : 30 est quel % de 200 → 15%
 */
export function whatPercent(part: number, total: number): number | { error: string } {
  if (total === 0) return { error: 'DIVISION_BY_ZERO' };
  const result = (part / total) * 100;
  if (!isFinite(result)) return { error: 'INVALID_RESULT' };
  return result;
}

/**
 * Arrondi intelligent pour les résultats de pourcentage
 */
export function roundPercent(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  // Max 4 décimales, supprimer les zéros trailing
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
