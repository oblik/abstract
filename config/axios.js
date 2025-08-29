import axios from "axios";
import { getCookie } from "cookies-next";
import { removeAuthToken } from "@/lib/cookies";

import config from "./config";
import store from "../store";
import { signOut } from "@/store/slices/auth/sessionSlice";
import { toastAlert } from "@/lib/toast";

const isClient = typeof window !== "undefined";

axios.defaults.baseURL = config.baseUrl;
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  async (config) => {
    let authorizationToken = null;

    if (isClient) {
      authorizationToken = getCookie("user-token");
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
      config.headers.Authorization = `Bearer ${authorizationToken}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const setAuthorization = (token) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const removeAuthorization = () => {
  delete axios.defaults.headers.common["Authorization"];
};

export const handleResp = (respData, type = 'success', doc) => {
  try {
    const { signedIn } = store.getState()?.auth?.session;
    if (
      signedIn &&
      type === "error" &&
      respData &&
      respData.response &&
      respData.response.status === 401
    ) {
      document.cookie = "user-token" + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      removeAuthToken();
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

export const axiosNoCredentials = axios.create();
axiosNoCredentials.defaults.withCredentials = false;

axiosNoCredentials.interceptors.request.use(
  async (config) => {
    let authorizationToken = null;

    if (isClient) {
      authorizationToken = getCookie("user-token");
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
      config.headers.Authorization = `Bearer ${authorizationToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
