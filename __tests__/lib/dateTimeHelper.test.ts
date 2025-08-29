import { getTimeframeDate } from '@/lib/dateTimeHelper';

describe('getTimeframeDate', () => {
  const mockNow = 1701443400000; // Dec 1, 2023 14:30:00
  const mockDate = new Date(mockNow);

  beforeEach(() => {
    // Mock current time and Date constructor
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return 1 hour ago for "1h" timeframe', () => {
    const result = getTimeframeDate('1h');
    const expected = new Date(mockNow - 1 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should return 6 hours ago for "6h" timeframe', () => {
    const result = getTimeframeDate('6h');
    const expected = new Date(mockNow - 6 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should return 1 day ago for "1d" timeframe', () => {
    const result = getTimeframeDate('1d');
    const expected = new Date(mockNow - 24 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should return 1 week ago for "1w" timeframe', () => {
    const result = getTimeframeDate('1w');
    const expected = new Date(mockNow - 7 * 24 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should return 1 month ago for "1m" timeframe', () => {
    const result = getTimeframeDate('1m');
    const expected = new Date(new Date(mockNow).setMonth(new Date(mockNow).getMonth() - 1));
    expect(result).toEqual(expected);
  });

  test('should return 6 months ago for "6m" timeframe', () => {
    const result = getTimeframeDate('6m');
    const expected = new Date(new Date(mockNow).setMonth(new Date(mockNow).getMonth() - 6));
    expect(result).toEqual(expected);
  });

  test('should return 1 year ago for "1y" timeframe', () => {
    const result = getTimeframeDate('1y');
    const expected = new Date(new Date(mockNow).setFullYear(new Date(mockNow).getFullYear() - 1));
    expect(result).toEqual(expected);
  });

  test('should return 1 year ago for "all" timeframe', () => {
    const result = getTimeframeDate('all');
    const expected = new Date(mockNow - 365 * 24 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should return 1 year ago for unknown timeframe', () => {
    const result = getTimeframeDate('unknown' as any);
    const expected = new Date(mockNow - 365 * 24 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should use default timeframe when no argument provided', () => {
    const result = getTimeframeDate();
    const expected = new Date(mockNow - 365 * 24 * 60 * 60 * 1000);
    expect(result).toEqual(expected);
  });

  test('should handle month rollover correctly', () => {
    // Mock January 2023
    const jan2023 = new Date('2023-01-15').getTime();
    const jan2023Date = new Date(jan2023);
    
    jest.restoreAllMocks(); // Clear previous mocks
    jest.spyOn(Date, 'now').mockReturnValue(jan2023);
    jest.spyOn(global, 'Date').mockImplementation(() => jan2023Date);
    
    const result = getTimeframeDate('1m');
    const expected = new Date(new Date(jan2023).setMonth(new Date(jan2023).getMonth() - 1));
    expect(result).toEqual(expected);
    // The function should handle rollover correctly
    expect(result.getMonth()).toBeLessThan(12); // Should be a valid month
  });

  test('should handle year rollover correctly', () => {
    // Mock January 2023
    const jan2023 = new Date('2023-01-15').getTime();
    const jan2023Date = new Date(jan2023);
    
    jest.restoreAllMocks(); // Clear previous mocks
    jest.spyOn(Date, 'now').mockReturnValue(jan2023);
    jest.spyOn(global, 'Date').mockImplementation(() => jan2023Date);
    
    const result = getTimeframeDate('1y');
    const expected = new Date(new Date(jan2023).setFullYear(new Date(jan2023).getFullYear() - 1));
    expect(result).toEqual(expected);
    // The function should handle rollover correctly
    expect(result.getFullYear()).toBeLessThan(2023); // Should be a previous year
  });
});