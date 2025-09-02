import { ApiResponse } from "@/types";
import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";

/**
 * Centralized environment detection utilities
 */
export const getEnvironment = () => {
  const isServer = typeof window === "undefined";
  const isClient = typeof window !== "undefined";
  
  // Check if we're running locally (dev server or production build on localhost)
  const isLocalhost = isClient ? 
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" :
    false;
  
  // True production means NODE_ENV=production AND not running on localhost
  const isActualProduction = process.env.NODE_ENV === "production" && !isLocalhost;
  
  return {
    isDevelopment: process.env.NODE_ENV !== "production",
    isProduction: process.env.NODE_ENV === "production",
    isActualProduction, // Only true when deployed, not on localhost
    isLocalhost,
    isServer,
    isClient
  };
};

/**
 * Centralized API base URL management
 * This ensures consistent URL handling across all services and fixes SSR issues
 */
export function getApiBaseUrl(): string {
  const env = getEnvironment();

  // Only use direct backend URL when actually deployed to production
  if (env.isActualProduction) {
    return config.backendURL;
  }

  // For localhost (both dev and production build), use Next.js proxy
  if (env.isLocalhost) {
    if (env.isServer) {
      // SSR on localhost needs full URL
      return config.backendURL;
    }
    // Client-side on localhost can use Next.js proxy
    return "";
  }

  // Fallback for any other case
  return config.backendURL;
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
