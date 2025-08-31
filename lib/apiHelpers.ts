import { ApiResponse } from "@/types";

/**
 * Checks if an API response is successful by checking both 'success' and 'status' properties
 * This is needed because the backend uses both properties inconsistently
 */
export const checkApiSuccess = (response: ApiResponse): boolean => {
  return response.success === true || response.status === true;
};

/**
 * Helper to safely get data from API response that might use either 'data' or 'result'
 */
export const getResponseData = <T>(response: ApiResponse<T>): T | undefined => {
  return response.data ?? response.result;
};

/**
 * Helper to safely get result from API response that might use either 'data' or 'result'
 */
export const getResponseResult = <T>(response: ApiResponse<T>): T | undefined => {
  return response.result ?? response.data;
};
