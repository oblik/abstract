import { checkApiSuccess, getResponseData, getResponseResult } from '@/lib/apiHelpers';

describe('checkApiSuccess', () => {
  test('should return true when success property is true', () => {
    const response = { success: true, data: 'test' };
    expect(checkApiSuccess(response)).toBe(true);
  });

  test('should return true when status property is true', () => {
    const response = { status: true, data: 'test' };
    expect(checkApiSuccess(response)).toBe(true);
  });

  test('should return true when both success and status are true', () => {
    const response = { success: true, status: true, data: 'test' };
    expect(checkApiSuccess(response)).toBe(true);
  });

  test('should return false when success is false', () => {
    const response = { success: false, data: 'test' };
    expect(checkApiSuccess(response)).toBe(false);
  });

  test('should return false when status is false', () => {
    const response = { status: false, data: 'test' };
    expect(checkApiSuccess(response)).toBe(false);
  });

  test('should return false when both success and status are false', () => {
    const response = { success: false, status: false, data: 'test' };
    expect(checkApiSuccess(response)).toBe(false);
  });

  test('should return false when neither success nor status is present', () => {
    const response = { data: 'test' };
    expect(checkApiSuccess(response)).toBe(false);
  });

  test('should return false for empty object', () => {
    const response = {};
    expect(checkApiSuccess(response)).toBe(false);
  });

  test('should return false for null/undefined', () => {
    expect(checkApiSuccess(null as any)).toBe(false);
    expect(checkApiSuccess(undefined as any)).toBe(false);
  });
});

describe('getResponseData', () => {
  test('should return data when data property exists', () => {
    const response = { data: 'test data', result: 'test result' };
    expect(getResponseData(response)).toBe('test data');
  });

  test('should return result when data property does not exist', () => {
    const response = { result: 'test result' };
    expect(getResponseData(response)).toBe('test result');
  });

  test('should return result when data property is null', () => {
    const response = { data: null, result: 'test result' };
    expect(getResponseData(response)).toBe('test result');
  });

  test('should return result when data property is undefined', () => {
    const response = { data: undefined, result: 'test result' };
    expect(getResponseData(response)).toBe('test result');
  });

  test('should return undefined when neither data nor result exists', () => {
    const response = { other: 'value' };
    expect(getResponseData(response)).toBeUndefined();
  });

  test('should return undefined for empty object', () => {
    const response = {};
    expect(getResponseData(response)).toBeUndefined();
  });

  test('should return undefined for null/undefined', () => {
    expect(getResponseData(null as any)).toBeUndefined();
    expect(getResponseData(undefined as any)).toBeUndefined();
  });

  test('should work with generic types', () => {
    interface TestData {
      id: number;
      name: string;
    }
    
    const testData: TestData = { id: 1, name: 'test' };
    const response = { data: testData };
    
    const result = getResponseData<TestData>(response);
    expect(result).toEqual(testData);
    expect(result?.id).toBe(1);
    expect(result?.name).toBe('test');
  });
});

describe('getResponseResult', () => {
  test('should return result when result property exists', () => {
    const response = { data: 'test data', result: 'test result' };
    expect(getResponseResult(response)).toBe('test result');
  });

  test('should return data when result property does not exist', () => {
    const response = { data: 'test data' };
    expect(getResponseResult(response)).toBe('test data');
  });

  test('should return data when result property is null', () => {
    const response = { data: 'test data', result: null };
    expect(getResponseResult(response)).toBe('test data');
  });

  test('should return data when result property is undefined', () => {
    const response = { data: 'test data', result: undefined };
    expect(getResponseResult(response)).toBe('test data');
  });

  test('should return undefined when neither data nor result exists', () => {
    const response = { other: 'value' };
    expect(getResponseResult(response)).toBeUndefined();
  });

  test('should return undefined for empty object', () => {
    const response = {};
    expect(getResponseResult(response)).toBeUndefined();
  });

  test('should return undefined for null/undefined', () => {
    expect(getResponseResult(null as any)).toBeUndefined();
    expect(getResponseResult(undefined as any)).toBeUndefined();
  });

  test('should work with generic types', () => {
    interface TestResult {
      success: boolean;
      count: number;
    }
    
    const testResult: TestResult = { success: true, count: 42 };
    const response = { result: testResult };
    
    const result = getResponseResult<TestResult>(response);
    expect(result).toEqual(testResult);
    expect(result?.success).toBe(true);
    expect(result?.count).toBe(42);
  });
});