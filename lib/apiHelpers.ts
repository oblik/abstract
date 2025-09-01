import { ApiResponse } from "@/types";
import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";

/**
 * Centralized environment detection utilities
 */
export const getEnvironment = () => {
  return {
    isDevelopment: process.env.NODE_ENV !== "production",
    isProduction: process.env.NODE_ENV === "production",
    isServer: typeof window === "undefined",
    isClient: typeof window !== "undefined"
  };
};

/**
 * Centralized API base URL management
 * This ensures consistent URL handling across all services and fixes SSR issues
 */
export function getApiBaseUrl(): string {
  const env = getEnvironment();

  if (env.isProduction) {
    return config.backendURL;
  }

  // Development environment
  if (env.isServer) {
    // SSR needs full URL - fixes the SSR proxy bypass issue
    return config.backendURL;
  }

  // Client-side can use Next.js proxy routes
  return "";
}

/**
 * Get the third-party API base URL for services like IP geolocation
 */
export function getThirdPartyApiBaseUrl(): string {
  const env = getEnvironment();

  if (env.isProduction) {
    return config.getLoginInfo;
  }
  return "/freeipapi"; // Use Next.js proxy in development
}

/**
 * Centralized API request wrapper to eliminate redundant try-catch patterns
 * Automatically handles success/error responses with consistent formatting
 */
export async function apiRequest(config: {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  data?: any;
  params?: any;
}): Promise<any> {
  try {
    const respData = await axios({
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}

/**
 * Simplified GET request
 */
export async function apiGet(url: string, params?: any): Promise<any> {
  return apiRequest({ url, method: 'get', params });
}

/**
 * Simplified POST request
 */
export async function apiPost(url: string, data?: any): Promise<any> {
  return apiRequest({ url, method: 'post', data });
}

/**
 * Simplified PUT request
 */
export async function apiPut(url: string, data?: any): Promise<any> {
  return apiRequest({ url, method: 'put', data });
}

/**
 * Simplified DELETE request
 */
export async function apiDelete(url: string): Promise<any> {
  return apiRequest({ url, method: 'delete' });
}

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
