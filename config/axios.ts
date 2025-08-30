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
      authorizationToken = getCookie("user-token") as string | undefined;
    } else {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("user-token");
        if (token) {
          authorizationToken = token.value;
        }
      } catch (error) {
        console.error("Error accessing server-side cookies:", error);
      }
    }

    if (authorizationToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authorizationToken}`;
    } else {
      if (config.headers) {
        delete config.headers.Authorization;
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
    // console.log(signedIn, "signedIn");
    // console.log(respData, "respData");
    if (
      signedIn &&
      type === "error" &&
      respData &&
      respData.response &&
      respData.response.status === 401
    ) {
      // store.dispatch(clearUser());
      // store.dispatch(clearWallet());
      // disconnectWallet();
      // dispatch(reset());
      document.cookie = "user-token" + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      store.dispatch(signOut());
      toastAlert("error", "Your session has expired, please login again", "session-expired");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return true;
    }
    if (doc === true && type === 'success' && respData && respData.data) {
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