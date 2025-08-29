import { momentFormat } from '@/app/helper/date';

// Mock moment
const mockMoment = jest.fn().mockImplementation(() => ({
  format: jest.fn().mockReturnValue('2023-12-01 14:30')
}));

jest.mock('moment', () => mockMoment);

import moment from 'moment';

describe('momentFormat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should format valid date string', () => {
    const result = momentFormat('2023-12-01T14:30:00Z');
    expect(result).toBe('2023-12-01 14:30');
    expect(mockMoment).toHaveBeenCalledWith(new Date('2023-12-01T14:30:00Z'));
  });

  test('should format valid Date object', () => {
    const date = new Date('2023-12-01T14:30:00Z');
    const result = momentFormat(date);
    expect(result).toBe('2023-12-01 14:30');
    expect(mockMoment).toHaveBeenCalledWith(date);
  });

  test('should format valid timestamp', () => {
    const timestamp = 1701443400000;
    const result = momentFormat(timestamp);
    expect(result).toBe('2023-12-01 14:30');
    expect(mockMoment).toHaveBeenCalledWith(new Date(timestamp));
  });

  test('should use default format when not specified', () => {
    momentFormat('2023-12-01T14:30:00Z');
    expect(mockMoment(new Date('2023-12-01T14:30:00Z')).format).toHaveBeenCalledWith('YYYY-MM-DD HH:mm');
  });

  test('should use custom format when specified', () => {
    momentFormat('2023-12-01T14:30:00Z', 'MM/DD/YYYY');
    expect(mockMoment(new Date('2023-12-01T14:30:00Z')).format).toHaveBeenCalledWith('MM/DD/YYYY');
  });

  test('should return empty string for empty input', () => {
    expect(momentFormat('')).toBe('');
    expect(momentFormat(null)).toBe('');
    expect(momentFormat(undefined)).toBe('');
  });

  test('should return empty string for invalid date', () => {
    // Mock moment to return invalid date
    (mockMoment as jest.Mock).mockReturnValueOnce({
      format: jest.fn().mockReturnValue('Invalid date')
    });
    
    expect(momentFormat('invalid-date')).toBe('');
  });

  test('should handle error gracefully', () => {
    // Mock moment to throw an error
    (mockMoment as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid date');
    });
    
    expect(momentFormat('2023-12-01T14:30:00Z')).toBe('');
  });
});