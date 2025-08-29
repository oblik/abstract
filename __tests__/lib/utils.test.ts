import { availableBalance, cn } from '@/lib/utils';

describe('cn', () => {
  test('should merge class names correctly', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  test('should handle empty strings', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });

  test('should handle undefined and null', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  test('should handle boolean values', () => {
    const result = cn('class1', true && 'class2', false && 'class3');
    expect(result).toBe('class1 class2');
  });

  test('should handle arrays', () => {
    const result = cn('class1', ['class2', 'class3'], 'class4');
    expect(result).toBe('class1 class2 class3 class4');
  });

  test('should handle objects with boolean values', () => {
    const result = cn('class1', { 'class2': true, 'class3': false });
    expect(result).toBe('class1 class2');
  });

  test('should handle numbers', () => {
    const result = cn('class1', 0, 1, 'class2');
    expect(result).toBe('class1 0 1 class2');
  });

  test('should return empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  test('should return empty string for empty array', () => {
    const result = cn([]);
    expect(result).toBe('');
  });

  test('should handle nested arrays', () => {
    const result = cn('class1', ['class2', ['class3']], 'class4');
    expect(result).toBe('class1 class2 class3 class4');
  });
});

describe('availableBalance', () => {
  test('should calculate available balance correctly', () => {
    const asset = {
      balance: '100',
      locked: '20'
    };
    const result = availableBalance(asset);
    expect(result).toBe('80');
  });

  test('should handle string inputs', () => {
    const asset = {
      balance: '150.50',
      locked: '50.25'
    };
    const result = availableBalance(asset);
    expect(result).toBe('100.25');
  });

  test('should handle number inputs', () => {
    const asset = {
      balance: 100,
      locked: 20
    };
    const result = availableBalance(asset);
    expect(result).toBe('80');
  });

  test('should handle zero balance', () => {
    const asset = {
      balance: '0',
      locked: '0'
    };
    const result = availableBalance(asset);
    expect(result).toBe('0');
  });

  test('should handle zero locked amount', () => {
    const asset = {
      balance: '100',
      locked: '0'
    };
    const result = availableBalance(asset);
    expect(result).toBe('100');
  });

  test('should handle negative values (should not happen but test for robustness)', () => {
    const asset = {
      balance: '100',
      locked: '150'
    };
    const result = availableBalance(asset);
    expect(result).toBe('-50');
  });

  test('should handle null asset', () => {
    const result = availableBalance(null);
    expect(result).toBe('0');
  });

  test('should handle undefined asset', () => {
    const result = availableBalance(undefined);
    expect(result).toBe('0');
  });

  test('should handle missing balance or locked', () => {
    const asset1 = { balance: '100' };
    const asset2 = { locked: '20' };
    const asset3 = {};
    
    expect(availableBalance(asset1)).toBe('100');
    expect(availableBalance(asset2)).toBe('0');
    expect(availableBalance(asset3)).toBe('0');
  });

  test('should handle very large numbers', () => {
    const asset = {
      balance: '999999999.999',
      locked: '111111111.111'
    };
    const result = availableBalance(asset);
    expect(result).toBe('888888888.888');
  });

  test('should handle very small numbers', () => {
    const asset = {
      balance: '0.000001',
      locked: '0.0000005'
    };
    const result = availableBalance(asset);
    expect(result).toBe('0.0000005');
  });

  test('should handle scientific notation', () => {
    const asset = {
      balance: '1e10',
      locked: '5e9'
    };
    const result = availableBalance(asset);
    expect(result).toBe('5000000000');
  });
});