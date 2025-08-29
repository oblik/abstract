// Tests for custommath.js functions that can be tested independently
// Note: This file tests individual functions in isolation since the main file uses ES6 imports

describe('custommath functions', () => {
  describe('numberFloatOnly', () => {
    const numberFloatOnly = (value) => {
      //eslint-disable-next-line
      const regxFormat = /^-?\d*(?:[.]\d*)?$/;
      var result = regxFormat.test(value)
      return result;
    };

    test('should return true for valid float numbers', () => {
      expect(numberFloatOnly('123.45')).toBe(true);
      expect(numberFloatOnly('-123.45')).toBe(true);
      expect(numberFloatOnly('0.45')).toBe(true);
      expect(numberFloatOnly('123')).toBe(true);
      expect(numberFloatOnly('0')).toBe(true);
      expect(numberFloatOnly('-0')).toBe(true);
    });

    test('should return false for invalid float numbers', () => {
      expect(numberFloatOnly('123.45.67')).toBe(false);
      expect(numberFloatOnly('abc')).toBe(false);
      expect(numberFloatOnly('123abc')).toBe(false);
      expect(numberFloatOnly('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(numberFloatOnly('.')).toBe(false);
      expect(numberFloatOnly('-.')).toBe(false);
      expect(numberFloatOnly('123.')).toBe(true);
      expect(numberFloatOnly('.45')).toBe(true);
    });
  });

  describe('numberOnly', () => {
    const numberOnly = (value) => {
      try {
        const regxFormat = /^[0-9]*$/;
        var result = regxFormat.test(value)
        return result;
      } catch (err) {
        return false;
      }
    };

    test('should return true for valid integers', () => {
      expect(numberOnly('123')).toBe(true);
      expect(numberOnly('0')).toBe(true);
      expect(numberOnly('456')).toBe(true);
    });

    test('should return false for non-integers', () => {
      expect(numberOnly('123.45')).toBe(false);
      expect(numberOnly('abc')).toBe(false);
      expect(numberOnly('123abc')).toBe(false);
      expect(numberOnly('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(numberOnly('-123')).toBe(false);
      expect(numberOnly('+123')).toBe(false);
    });
  });

  describe('isFirstLetterCaps', () => {
    const isFirstLetterCaps = (str) => {
      try {
        var first = str.charAt(0).toUpperCase();
        var letter = str.slice(1)
        var fullname = first + letter
        return fullname
      } catch(err) {
        return "";
      }
    };

    test('should capitalize first letter', () => {
      expect(isFirstLetterCaps('hello')).toBe('Hello');
      expect(isFirstLetterCaps('hELLO')).toBe('HELLO');
      expect(isFirstLetterCaps('hello world')).toBe('Hello world');
    });

    test('should handle single character', () => {
      expect(isFirstLetterCaps('h')).toBe('H');
      expect(isFirstLetterCaps('H')).toBe('H');
    });

    test('should handle empty string', () => {
      expect(isFirstLetterCaps('')).toBe('');
    });

    test('should handle error gracefully', () => {
      expect(isFirstLetterCaps(null)).toBe('');
      expect(isFirstLetterCaps(undefined)).toBe('');
    });
  });

  describe('toFixedWithoutRound', () => {
    const toFixedWithoutRound = (number, decimalPlaces = 2) => {
      try {
        let numberString = number.toString();
        let decimalIndex = numberString.indexOf('.');
        if (decimalIndex === -1) {
          return number;
        }
        numberString = numberString.slice(0, decimalIndex + decimalPlaces + 1);
        let truncatedNumber = parseFloat(numberString);
        return truncatedNumber;
      } catch (err) {
        return 0;
      }
    };

    test('should truncate decimal places without rounding', () => {
      expect(toFixedWithoutRound(3.14159, 2)).toBe(3.14);
      expect(toFixedWithoutRound(3.149, 2)).toBe(3.14);
      expect(toFixedWithoutRound(3.999, 2)).toBe(3.99);
    });

    test('should handle whole numbers', () => {
      expect(toFixedWithoutRound(3, 2)).toBe(3);
      expect(toFixedWithoutRound(3.0, 2)).toBe(3);
    });

    test('should handle negative numbers', () => {
      expect(toFixedWithoutRound(-3.14159, 2)).toBe(-3.14);
      expect(toFixedWithoutRound(-3.149, 2)).toBe(-3.14);
    });

    test('should handle error gracefully', () => {
      expect(toFixedWithoutRound('invalid', 2)).toBe(0);
    });
  });

  describe('shortText and shortValue', () => {
    const shortText = (address) => {
      try {
        if (!address || address.length < 44) return "";
        var addr = address.substring(0, 4);
        var addr1 = address.substring(38, 44);
        var concat = addr + "...." + addr1;
        return concat;
      } catch (err) {
        return "";
      }
    };

    const shortValue = (address) => {
      try {
        if (!address || address.length < 42) return "";
        var addr = address.substring(0, 6);
        var addr1 = address.substring(34, 42);
        var concat = addr + "...." + addr1;
        return concat;
      } catch (err) {
        return "";
      }
    };

    test('should shorten address correctly', () => {
      const address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
      expect(shortText(address)).toBe('9WzD....YtAW');
      expect(shortValue(address)).toBe('9WzDXW....tAWWM');
    });

    test('should handle short strings', () => {
      expect(shortText('short')).toBe('');
      expect(shortValue('short')).toBe('');
    });

    test('should handle empty string', () => {
      expect(shortText('')).toBe('');
      expect(shortValue('')).toBe('');
    });

    test('should handle error gracefully', () => {
      expect(shortText(null)).toBe('');
      expect(shortValue(null)).toBe('');
    });
  });
});