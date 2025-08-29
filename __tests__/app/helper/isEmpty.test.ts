import isEmpty from '@/app/helper/isEmpty';
import { isBoolean, isEmptyObject } from '@/app/helper/isEmpty';

describe('isEmpty', () => {
  test('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  test('should return true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  test('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  test('should return true for whitespace string', () => {
    expect(isEmpty('   ')).toBe(true);
  });

  test('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  test('should return false for non-empty string', () => {
    expect(isEmpty('hello')).toBe(false);
  });

  test('should return false for non-empty object', () => {
    expect(isEmpty({ key: 'value' })).toBe(false);
  });

  test('should return false for number 0', () => {
    expect(isEmpty(0)).toBe(false);
  });

  test('should return false for boolean false', () => {
    expect(isEmpty(false)).toBe(false);
  });

  test('should return false for array', () => {
    expect(isEmpty([1, 2, 3])).toBe(false);
  });

  test('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });
});

describe('isBoolean', () => {
  test('should return true for boolean true', () => {
    expect(isBoolean(true)).toBe(true);
  });

  test('should return true for boolean false', () => {
    expect(isBoolean(false)).toBe(true);
  });

  test('should return true for string "true"', () => {
    expect(isBoolean('true')).toBe(true);
  });

  test('should return true for string "false"', () => {
    expect(isBoolean('false')).toBe(true);
  });

  test('should return false for other strings', () => {
    expect(isBoolean('hello')).toBe(false);
    expect(isBoolean('TRUE')).toBe(false);
    expect(isBoolean('FALSE')).toBe(false);
  });

  test('should return false for numbers', () => {
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean(0)).toBe(false);
  });

  test('should return false for objects', () => {
    expect(isBoolean({})).toBe(false);
  });

  test('should return false for arrays', () => {
    expect(isBoolean([])).toBe(false);
  });

  test('should return false for null and undefined', () => {
    expect(isBoolean(null)).toBe(false);
    expect(isBoolean(undefined)).toBe(false);
  });
});

describe('isEmptyObject', () => {
  test('should return true for empty object', () => {
    expect(isEmptyObject({})).toBe(true);
  });

  test('should return true for object with null values', () => {
    expect(isEmptyObject({ a: null, b: undefined, c: '' })).toBe(true);
  });

  test('should return false for object with non-empty values', () => {
    expect(isEmptyObject({ a: 'value' })).toBe(false);
  });

  test('should return false for object with mixed values', () => {
    expect(isEmptyObject({ a: '', b: 'value' })).toBe(false);
  });

  test('should return false for object with number 0', () => {
    expect(isEmptyObject({ a: 0 })).toBe(false);
  });

  test('should return false for object with boolean false', () => {
    expect(isEmptyObject({ a: false })).toBe(false);
  });
});