import { sanitizeNumericInput } from '../utils/sanitize';

describe('sanitizeNumericInput', () => {
  it('accepts digits', () => {
    expect(sanitizeNumericInput('123')).toBe('123');
  });

  it('accepts a single decimal point', () => {
    expect(sanitizeNumericInput('12.5')).toBe('12.5');
  });

  it('converts comma to dot', () => {
    expect(sanitizeNumericInput('12,5')).toBe('12.5');
  });

  it('allows only one decimal separator', () => {
    expect(sanitizeNumericInput('12.5.3')).toBe('12.53');
    expect(sanitizeNumericInput('12,5,3')).toBe('12.53');
    expect(sanitizeNumericInput('12.5,3')).toBe('12.53');
  });

  it('allows leading minus sign', () => {
    expect(sanitizeNumericInput('-42')).toBe('-42');
    expect(sanitizeNumericInput('-3.14')).toBe('-3.14');
  });

  it('rejects minus sign in middle or end', () => {
    expect(sanitizeNumericInput('12-3')).toBe('123');
    expect(sanitizeNumericInput('12-')).toBe('12');
  });

  it('rejects letters', () => {
    expect(sanitizeNumericInput('abc')).toBe('');
    expect(sanitizeNumericInput('12abc34')).toBe('1234');
    expect(sanitizeNumericInput('a1b2c3')).toBe('123');
  });

  it('rejects special characters', () => {
    expect(sanitizeNumericInput('12@#$%')).toBe('12');
    expect(sanitizeNumericInput('!@#')).toBe('');
    expect(sanitizeNumericInput('1+2')).toBe('12');
    expect(sanitizeNumericInput('1e5')).toBe('15');
  });

  it('handles empty string', () => {
    expect(sanitizeNumericInput('')).toBe('');
  });

  it('handles single dot', () => {
    expect(sanitizeNumericInput('.')).toBe('.');
  });

  it('handles single comma', () => {
    expect(sanitizeNumericInput(',')).toBe('.');
  });

  it('handles leading dot', () => {
    expect(sanitizeNumericInput('.5')).toBe('.5');
  });

  it('handles minus then dot', () => {
    expect(sanitizeNumericInput('-.5')).toBe('-.5');
  });

  it('handles spaces (rejected)', () => {
    expect(sanitizeNumericInput('1 2 3')).toBe('123');
  });
});
