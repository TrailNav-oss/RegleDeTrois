/**
 * Sanitizes numeric input: digits, one decimal point, optional leading minus.
 * Commas are converted to dots. All other characters are silently rejected.
 */
export function sanitizeNumericInput(value: string): string {
  let result = '';
  let hasDot = false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];

    if (ch === '-' && result === '') {
      result += ch;
    } else if ((ch === '.' || ch === ',') && !hasDot) {
      result += '.';
      hasDot = true;
    } else if (ch >= '0' && ch <= '9') {
      result += ch;
    }
  }

  return result;
}
