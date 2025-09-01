// import packages
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCookie } from "cookies-next";

// import lib
import config from "./config";
import store from "../store";
import { signOut } from "@/store/slices/auth/sessionSlice";
import { toastAlert } from "@/lib/toast";

const isClient = typeof window !== "undefined";

axios.defaults.baseURL = config.baseUrl;

axios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let authorizationToken: string | undefined | null = null;

    if (isClient) {
      authorizationToken = getCookie("user-token") as string;
      if (authorizationToken) {
        console.log("Client-side auth token found for request:", config.url);
      } else {
        console.log("No client-side auth token for request:", config.url);

        // Fallback: Check Redux store for token during hydration
        try {
          const authState = (store.getState() as any)?.auth?.session;
          if (authState?.signedIn && authState?.token) {
            authorizationToken = authState.token;
            console.log("Using Redux token as fallback for request:", config.url);
          }
        } catch (error) {
          console.log("No Redux token available for request:", config.url);
        }
      }
    } else {
      try {
        // For server-side rendering, try to get cookies from headers
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("user-token");
        if (token) {
          authorizationToken = token.value;
          console.log("Server-side auth token found for request:", config.url);
        } else {
          console.log("No server-side auth token for request:", config.url);
        }
      } catch (error) {
        console.error("Error accessing server-side cookies for:", config.url, error);
        // In edge runtime or when cookies are not available, skip auth
        // This is expected for server-side API calls without user context
      }
    }

    if (authorizationToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authorizationToken}`;
      if (config.url?.includes('/comments')) {
        console.log("Setting auth header for comment request:", config.headers.Authorization);
      }
    } else {
      delete config.headers.Authorization;
      if (config.url?.includes('/comments')) {
        console.log("No auth token available for comment request:", config.url);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export const setAuthorization = (token: string): void => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const removeAuthorization = (): void => {
  delete axios.defaults.headers.common["Authorization"];
};

interface ResponseData {
  data?: any;
  response?: {
    status: number;
    data: any;
  };
}

export const handleResp = (respData: ResponseData | any, type: 'success' | 'error' = 'success', doc?: boolean): any => {
  try {
    const { signedIn } = (store.getState() as any)?.auth?.session;
    const userData = (store.getState() as any)?.auth?.user;

    // Only auto-logout on 401 if:
    // 1. User is marked as signed in
    // 2. User data exists (meaning they were properly authenticated)
    // 3. The error is actually a 401
    // 4. There's a user token cookie that should have worked
    if (
      signedIn &&
      userData &&
      userData.id &&
      type === "error" &&
      respData &&
      respData.response &&
      respData.response.status === 401
    ) {
      // Additional check: see if we have a token cookie
      const isClient = typeof window !== "undefined";
      let hasToken = false;

      if (isClient) {
        try {
          hasToken = !!getCookie("user-token");
        } catch (e) {
          console.error("Error checking cookie:", e);
        }
      }

      // Only auto-logout if we had a token but it was rejected
      if (hasToken) {
        console.log("Valid auth token was rejected by server, logging out user");
        document.cookie = "user-token" + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        store.dispatch(signOut());
        toastAlert("error", "Your session has expired, please login again", "session-expired");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
        return true;
      } else {
        console.log("401 error but no auth token found, not auto-logging out");
      }
    }

    if (doc === true && type == 'success' && respData && respData.data) {
      return { data: respData.data }
    }
    if (type === 'success' && respData && respData.data) {
      return respData.data
    } else if (type === 'error' && respData && respData.response && respData.response.data) {
      return respData.response.data
    } else {
      return {
        success: false,
        message: 'Something went wrong',
      }
    }
  } catch (err) {
    return {
      success: false,
      message: 'Something went wrong',
    }
  }
}

export default axios;