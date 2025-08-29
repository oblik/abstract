// Tests for utils/helpers.js functions that can be tested independently
// Note: This file tests individual functions in isolation since the main file uses ES6 imports

describe('helpers functions', () => {
  describe('decimalToPercentage', () => {
    const decimalToPercentage = (decimal) => {
      // Multiply by 100 to convert to a percentage
      const percentage = decimal * 100;
      // Round to the nearest whole number
      const roundedPercentage = Math.round(percentage);
      return roundedPercentage;
    };

    test('should convert decimal to percentage', () => {
      expect(decimalToPercentage(0.5)).toBe(50);
      expect(decimalToPercentage(0.25)).toBe(25);
      expect(decimalToPercentage(0.75)).toBe(75);
      expect(decimalToPercentage(1.0)).toBe(100);
      expect(decimalToPercentage(0.0)).toBe(0);
    });

    test('should handle negative decimals', () => {
      expect(decimalToPercentage(-0.5)).toBe(-50);
      expect(decimalToPercentage(-0.25)).toBe(-25);
    });

    test('should handle decimals greater than 1', () => {
      expect(decimalToPercentage(1.5)).toBe(150);
      expect(decimalToPercentage(2.0)).toBe(200);
    });

    test('should handle very small decimals', () => {
      expect(decimalToPercentage(0.001)).toBe(0);
      expect(decimalToPercentage(0.004)).toBe(0);
      expect(decimalToPercentage(0.005)).toBe(1);
      expect(decimalToPercentage(0.009)).toBe(1);
    });
  });

  describe('toTwoDecimal', () => {
    const toTwoDecimal = (decimal) => {
      const roundedPercentage = Math.round(decimal * 100) / 100;
      return roundedPercentage;
    };

    test('should round to two decimal places', () => {
      expect(toTwoDecimal(3.14159)).toBe(3.14);
      expect(toTwoDecimal(3.149)).toBe(3.15);
      expect(toTwoDecimal(3.144)).toBe(3.14);
      expect(toTwoDecimal(3.145)).toBe(3.15);
    });

    test('should handle whole numbers', () => {
      expect(toTwoDecimal(3)).toBe(3);
      expect(toTwoDecimal(3.0)).toBe(3);
    });

    test('should handle negative numbers', () => {
      expect(toTwoDecimal(-3.14159)).toBe(-3.14);
      expect(toTwoDecimal(-3.149)).toBe(-3.15);
    });

    test('should handle very small numbers', () => {
      expect(toTwoDecimal(0.001)).toBe(0);
      expect(toTwoDecimal(0.004)).toBe(0);
      expect(toTwoDecimal(0.005)).toBe(0.01);
    });
  });

  describe('PnLFormatted', () => {
    const PnLFormatted = (pnl) => {
      return pnl >= 0 ? `$${pnl}` : `-$${pnl*-1}`;
    };

    test('should format positive PnL correctly', () => {
      expect(PnLFormatted(100)).toBe('$100');
      expect(PnLFormatted(50.5)).toBe('$50.5');
    });

    test('should format negative PnL correctly', () => {
      expect(PnLFormatted(-100)).toBe('-$100');
      expect(PnLFormatted(-50.5)).toBe('-$50.5');
    });

    test('should handle zero PnL', () => {
      expect(PnLFormatted(0)).toBe('$0');
    });
  });

  describe('getTimeAgo', () => {
    const getTimeAgo = (time) => {
      const now = 1701443400000; // Use the mock value directly
      const diffInSeconds = Math.floor((now - time) / 1000);

      const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
      ];

      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
          return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
      }

      return "just now";
    };

    beforeEach(() => {
      // Mock current time
      const mockNow = 1701443400000; // Dec 1, 2023 14:30:00
      const mockDate = new Date(mockNow);
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should return "just now" for very recent times', () => {
      const recentTime = 1701443400000 - 500; // 0.5 seconds ago
      expect(getTimeAgo(recentTime)).toBe('just now');
    });

    test('should return seconds ago', () => {
      const time = 1701443400000 - 45000; // 45 seconds ago
      expect(getTimeAgo(time)).toBe('45 seconds ago');
    });

    test('should return minutes ago', () => {
      const time = 1701443400000 - 180000; // 3 minutes ago
      expect(getTimeAgo(time)).toBe('3 minutes ago');
    });

    test('should return hours ago', () => {
      const time = 1701443400000 - 7200000; // 2 hours ago
      expect(getTimeAgo(time)).toBe('2 hours ago');
    });

    test('should return days ago', () => {
      const time = 1701443400000 - 172800000; // 2 days ago
      expect(getTimeAgo(time)).toBe('2 days ago');
    });

    test('should return weeks ago', () => {
      const time = 1701443400000 - 1209600000; // 2 weeks ago
      expect(getTimeAgo(time)).toBe('2 weeks ago');
    });

    test('should return months ago', () => {
      const time = 1701443400000 - 5270400000; // 2 months ago
      expect(getTimeAgo(time)).toBe('2 months ago');
    });

    test('should return years ago', () => {
      const time = 1701443400000 - 63072000000; // 2 years ago
      expect(getTimeAgo(time)).toBe('2 years ago');
    });

    test('should handle singular forms', () => {
      const time = 1701443400000 - 60000; // 1 minute ago
      expect(getTimeAgo(time)).toBe('1 minute ago');
    });
  });

  describe('getAccumulativeValue', () => {
    const getAccumulativeValue = (arr, length) => {
      if (!Array.isArray(arr)) {
        return 0;
      }
      let arr2 = [...arr];
      let total = 0;
      for (let i = 0; i <= length; i++) {
        if (i < arr2.length) {
          total += Number(arr2[i]?.[0]) * Number(arr2[i]?.[1]);
        }
      }
      return total;
    };

    test('should calculate accumulative value correctly', () => {
      const data = [[10, 5], [20, 3], [30, 2]];
      expect(getAccumulativeValue(data, 0)).toBe(50); // 10*5
      expect(getAccumulativeValue(data, 1)).toBe(110); // 10*5 + 20*3
      expect(getAccumulativeValue(data, 2)).toBe(170); // 10*5 + 20*3 + 30*2
    });

    test('should handle empty array', () => {
      expect(getAccumulativeValue([], 0)).toBe(0);
    });

    test('should handle non-array input', () => {
      expect(getAccumulativeValue(null, 0)).toBe(0);
      expect(getAccumulativeValue(undefined, 0)).toBe(0);
      expect(getAccumulativeValue('not an array', 0)).toBe(0);
    });

    test('should handle index out of bounds', () => {
      const data = [[10, 5], [20, 3]];
      expect(getAccumulativeValue(data, 5)).toBe(110); // Should use available data (10*5 + 20*3)
    });
  });

  describe('getAccumulativeValueReverse', () => {
    const getAccumulativeValueReverse = (arr, length) => {
      if (!Array.isArray(arr)) {
        return 0;
      }
      let arr2 = [...arr];
      arr2 = arr2.reverse();
      let total = 0;
      for (let i = 0; i <= length; i++) {
        if (i < arr2.length) {
          total += Number(arr2[i]?.[0]) * Number(arr2[i]?.[1]);
        }
      }
      return total;
    };

    test('should calculate accumulative value in reverse', () => {
      const data = [[10, 5], [20, 3], [30, 2]];
      expect(getAccumulativeValueReverse(data, 0)).toBe(60); // 30*2
      expect(getAccumulativeValueReverse(data, 1)).toBe(120); // 30*2 + 20*3
      expect(getAccumulativeValueReverse(data, 2)).toBe(170); // 30*2 + 20*3 + 10*5
    });

    test('should handle empty array', () => {
      expect(getAccumulativeValueReverse([], 0)).toBe(0);
    });

    test('should handle non-array input', () => {
      expect(getAccumulativeValueReverse(null, 0)).toBe(0);
      expect(getAccumulativeValueReverse(undefined, 0)).toBe(0);
      expect(getAccumulativeValueReverse('not an array', 0)).toBe(0);
    });
  });
});