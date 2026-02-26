/**
 * Résout une règle de trois : A/B = C/X
 * Retourne la valeur du champ manquant, ou null si impossible.
 *
 * fields: { a, b, c, x } — exactement un doit être null
 */
export function solveCrossMultiply(fields: {
  a: number | null;
  b: number | null;
  c: number | null;
  x: number | null;
}): { field: 'a' | 'b' | 'c' | 'x'; value: number } | { error: string } {
  const { a, b, c, x } = fields;
  const nullCount = [a, b, c, x].filter((v) => v === null).length;

  if (nullCount !== 1) {
    return { error: 'EXACTLY_ONE_EMPTY' };
  }

  // A/B = C/X → A*X = B*C
  if (a === null) {
    if (x === 0) return { error: 'DIVISION_BY_ZERO' };
    return { field: 'a', value: (b! * c!) / x! };
  }
  if (b === null) {
    if (c === 0) return { error: 'DIVISION_BY_ZERO' };
    return { field: 'b', value: (a! * x!) / c! };
  }
  if (c === null) {
    if (b === 0) return { error: 'DIVISION_BY_ZERO' };
    return { field: 'c', value: (a! * x!) / b! };
  }
  // x === null
  if (a === 0) return { error: 'DIVISION_BY_ZERO' };
  return { field: 'x', value: (b! * c!) / a! };
}

/**
 * Recalcule les quantités d'ingrédients pour un nouveau nombre de portions
 */
export function scaleIngredients(
  ingredients: { qty: number }[],
  basePortions: number,
  newPortions: number
): number[] {
  if (basePortions === 0) return ingredients.map(() => 0);
  const ratio = newPortions / basePortions;
  return ingredients.map((ing) => Math.round(ing.qty * ratio * 100) / 100);
}

/**
 * Arrondi intelligent selon l'unité :
 * - pièce, c.à.s, c.à.c → entier
 * - g, kg → entier
 * - ml, cl, L → 1 décimale
 */
export function smartRound(value: number, unit: string): number {
  if (unit === 'ml' || unit === 'cl' || unit === 'L' || unit === 'cup' || unit === 'fl oz') {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
}

/**
 * Mode ajusté : l'utilisateur modifie UN ingrédient, tout le reste se recalcule.
 * Retourne { ratio, scaledIngredients, newPortions } ou null si impossible.
 */
export function adjustByIngredient(
  ingredients: { qty: number; unit: string }[],
  basePortions: number,
  driverIndex: number,
  driverNewQty: number
): { ratio: number; quantities: number[]; portions: number } | null {
  const baseQty = ingredients[driverIndex]?.qty;
  if (!baseQty || baseQty === 0) return null;
  if (driverNewQty < 0) return null;

  const ratio = driverNewQty / baseQty;

  const quantities = ingredients.map((ing, i) => {
    if (i === driverIndex) return driverNewQty;
    return smartRound(ing.qty * ratio, ing.unit);
  });

  const portions = Math.round(basePortions * ratio * 10) / 10;

  return { ratio, quantities, portions };
}
