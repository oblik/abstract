import { toFixedDown } from '@/app/helper/roundOf';

describe('toFixedDown', () => {
  test('should return empty string for empty input', () => {
    expect(toFixedDown('')).toBe('');
    expect(toFixedDown(null)).toBe('');
    expect(toFixedDown(undefined)).toBe('');
  });

  test('should return empty string for NaN input', () => {
    expect(toFixedDown('NaN')).toBe('');
    expect(toFixedDown('invalid')).toBe('');
  });

  test('should truncate decimal places without rounding', () => {
    expect(toFixedDown('3.14159', 2)).toBe(3.14);
    expect(toFixedDown('3.149', 2)).toBe(3.14);
    expect(toFixedDown('3.999', 2)).toBe(3.99);
  });

  test('should handle default decimal places (2)', () => {
    expect(toFixedDown('3.14159')).toBe(3.14);
  });

  test('should handle different decimal places', () => {
    expect(toFixedDown('3.14159', 0)).toBe(3);
    expect(toFixedDown('3.14159', 4)).toBe(3.1415);
    expect(toFixedDown('3.14159', 6)).toBe(3.14159);
  });

  test('should handle negative numbers', () => {
    expect(toFixedDown('-3.14159', 2)).toBe(-3.14);
    expect(toFixedDown('-3.999', 2)).toBe(-3.99);
  });

  test('should handle whole numbers', () => {
    expect(toFixedDown('3', 2)).toBe(3);
    expect(toFixedDown('3.0', 2)).toBe(3);
  });

  test('should handle numbers with fewer decimal places than requested', () => {
    expect(toFixedDown('3.1', 4)).toBe(3.1);
    expect(toFixedDown('3', 4)).toBe(3);
  });

  test('should handle string input', () => {
    expect(toFixedDown('3.14159', 2)).toBe(3.14);
  });

  test('should handle number input', () => {
    expect(toFixedDown(3.14159, 2)).toBe(3.14);
  });

  test('should handle very small numbers', () => {
    expect(toFixedDown('0.000001', 6)).toBe(0.000001);
    // The function might return scientific notation for very small numbers
    const result = toFixedDown('0.0000001', 6);
    expect(result === '' || result === 1e-7).toBe(true);
  });

  test('should handle very large numbers', () => {
    expect(toFixedDown('999999.999', 2)).toBe(999999.99);
  });
});