/**
 * Parser de langage naturel pour la règle de trois.
 * Extrait quantité, base et cible d'une phrase en français.
 */

export interface ParsedInput {
  quantity: number;
  item?: string;
  base: number;
  baseUnit?: string;
  target: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Normalise une string numérique :
 * - Virgule FR → point : "2,5" → "2.5"
 * - Fractions simples : "1/2" → "0.5"
 */
function normalizeNumber(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, '');

  // Fraction: "1/2", "3/4"
  const fracMatch = s.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const denom = parseFloat(fracMatch[2]);
    if (denom === 0) return null;
    return parseFloat(fracMatch[1]) / denom;
  }

  // Comma → dot
  s = s.replace(',', '.');

  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

/**
 * Extrait un nombre potentiellement collé à une unité : "200g" → { num: 200, rest: "g" }
 */
function extractNumberAndUnit(token: string): { num: number; unit: string } | null {
  const match = token.match(/^(\d+[.,]?\d*(?:\/\d+)?)\s*(.*)$/);
  if (!match) return null;
  const num = normalizeNumber(match[1]);
  if (num === null) return null;
  return { num, unit: match[2].trim() };
}

// ── Pattern functions ─────────────────────────────────────

/**
 * Pattern 1: "si X [unit] pour Y [unit], combien pour Z"
 */
function patternSiPourCombien(input: string): ParsedInput | null {
  const re = /si\s+(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s+pour\s+(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)[\s,]*combien\s+pour\s+(\d+[.,]?\d*(?:\/\d+)?)/i;
  const m = input.match(re);
  if (!m) return null;

  const quantity = normalizeNumber(m[1]);
  const base = normalizeNumber(m[3]);
  const target = normalizeNumber(m[5]);

  if (quantity === null || base === null || target === null) return null;

  return {
    quantity,
    item: m[2] || undefined,
    base,
    baseUnit: m[4] || undefined,
    target,
    confidence: 'high',
  };
}

/**
 * Pattern 2: "combien de X pour Y si Z pour W"
 */
function patternCombienDeSiPour(input: string): ParsedInput | null {
  const re = /combien\s+(?:de\s+)?([\wéèêëàâäùûüôöïîçœæ.]*?)\s*pour\s+(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s*si\s+(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s*pour\s+(\d+[.,]?\d*(?:\/\d+)?)/i;
  const m = input.match(re);
  if (!m) return null;

  const target = normalizeNumber(m[2]);
  const quantity = normalizeNumber(m[4]);
  const base = normalizeNumber(m[6]);

  if (quantity === null || base === null || target === null) return null;

  return {
    quantity,
    item: m[5] || m[1] || undefined,
    base,
    baseUnit: m[3] || undefined,
    target,
    confidence: 'high',
  };
}

/**
 * Pattern 3: "X [unit] → Y [unit], Z [unit]"
 * Base → Cible, Quantité
 */
function patternArrow(input: string): ParsedInput | null {
  const re = /(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s*[→⟶\->]+\s*(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)[\s,]+(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*)/i;
  const m = input.match(re);
  if (!m) return null;

  const base = normalizeNumber(m[1]);
  const target = normalizeNumber(m[3]);
  const quantity = normalizeNumber(m[5]);

  if (quantity === null || base === null || target === null) return null;

  return {
    quantity,
    item: m[6] || undefined,
    base,
    baseUnit: m[2] || undefined,
    target,
    confidence: 'medium',
  };
}

/**
 * Pattern 4: "X pour Y = ? pour Z" or "X pour Y, ? pour Z"
 */
function patternProportional(input: string): ParsedInput | null {
  const re = /(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s*pour\s+(\d+[.,]?\d*(?:\/\d+)?)\s*[=,]\s*\??\s*pour\s+(\d+[.,]?\d*(?:\/\d+)?)/i;
  const m = input.match(re);
  if (!m) return null;

  const quantity = normalizeNumber(m[1]);
  const base = normalizeNumber(m[3]);
  const target = normalizeNumber(m[4]);

  if (quantity === null || base === null || target === null) return null;

  return {
    quantity,
    item: m[2] || undefined,
    base,
    target,
    confidence: 'medium',
  };
}

/**
 * Pattern 5: Simple "X pour Y pour Z" or "X pour Y, pour Z"
 */
function patternSimplePour(input: string): ParsedInput | null {
  const re = /(\d+[.,]?\d*(?:\/\d+)?)\s*([\wéèêëàâäùûüôöïîçœæ.]*?)\s*pour\s+(\d+[.,]?\d*(?:\/\d+)?)[\s,]+(?:pour\s+)?(\d+[.,]?\d*(?:\/\d+)?)/i;
  const m = input.match(re);
  if (!m) return null;

  const quantity = normalizeNumber(m[1]);
  const base = normalizeNumber(m[3]);
  const target = normalizeNumber(m[4]);

  if (quantity === null || base === null || target === null) return null;

  return {
    quantity,
    item: m[2] || undefined,
    base,
    target,
    confidence: 'medium',
  };
}

/**
 * Fallback: extraire les 3 premiers nombres de la string
 */
function patternFallbackNumbers(input: string): ParsedInput | null {
  const numbers: number[] = [];
  const re = /(\d+[.,]?\d*(?:\/\d+)?)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(input)) !== null) {
    const num = normalizeNumber(match[1]);
    if (num !== null) {
      numbers.push(num);
    }
    if (numbers.length === 3) break;
  }

  if (numbers.length < 3) return null;

  return {
    quantity: numbers[0],
    base: numbers[1],
    target: numbers[2],
    confidence: 'low',
  };
}

/**
 * Parse une entrée en langage naturel et extrait les valeurs pour la règle de trois.
 * Retourne null si aucune valeur exploitable n'est trouvée.
 */
export function parseNaturalInput(input: string): ParsedInput | null {
  if (!input || input.trim().length === 0) return null;

  // Normalize: remove extra spaces, lowercase for matching
  const normalized = input.trim().replace(/\s+/g, ' ');

  // Try patterns in priority order
  const patterns = [
    patternSiPourCombien,
    patternCombienDeSiPour,
    patternArrow,
    patternProportional,
    patternSimplePour,
    patternFallbackNumbers,
  ];

  for (const pattern of patterns) {
    const result = pattern(normalized);
    if (result) {
      // Clean up empty string items/units
      if (result.item === '') result.item = undefined;
      if (result.baseUnit === '') result.baseUnit = undefined;
      return result;
    }
  }

  return null;
}
