import axios from "axios";
import browser from "browser-detect";
import isEmpty from "@/app/helper/isEmpty";

import config from "@/config/config";

// Helper to get freeipapi base URL (use proxy in dev, full URL in prod)
function getFreeIpApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.getLoginInfo;
  }
  return "/freeipapi"; // Use Next.js proxy in development
}

// Helper to get API base URL (use proxy in dev, full URL in prod)
function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;
  }
  return ""; // Use Next.js proxy in development
}
import { handleResp, setAuthorization } from "@/config/axios";
import { signIn } from "@/store/slices/auth/sessionSlice";
import { setUser } from "@/store/slices/auth/userSlice";
import { setWallet } from "@/store/slices/wallet/dataSlice";
import { subscribe } from "@/config/socketConnectivity";
import {
  UserRegistrationData,
  GoogleLoginData,
  WalletLoginData,
  EmailVerificationData,
  ResendOTPData,
  ApiResponse,
  User,
  Wallet,
  LoginHistory,
  AppDispatch,
  ApiError
} from "@/types";

export const register = async (data: UserRegistrationData): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/register`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    console.log(error, "error")
    console.log(error, "error")
    console.log(error, "error")
    return handleResp(error, "error");
  }
};

export const googleLogin = async (reqBody: GoogleLoginData, dispatch: AppDispatch): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/google-sign`,
      method: "post",
      data: reqBody,
    });
    const { message, result } = respData.data;
    subscribe(result.user._id)
    dispatch(signIn(result.token));
    dispatch(setUser(result.user));
    dispatch(setWallet(result.wallet));
    await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: result.token }),
    });
    return {
      success: true,
      message,
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;

    return {
      success: false,
      message: apiError?.response?.data?.message || 'An error occurred',
      errors: apiError?.response?.data?.errors,
    };
  }
};

export const walletLogin = async (reqBody: WalletLoginData, dispatch: AppDispatch): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/wallet-sign`,
      method: "post",
      data: reqBody,
    });
    const { message, result } = respData.data;
    if(!isEmpty(result?.user?.email) && result?.user?.status === "verified" ){
      subscribe(result.user._id);
      dispatch(signIn(result?.token));
      dispatch(setUser(result?.user));
      dispatch(setWallet(result?.wallet));
      await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: result?.token }),
      });
    }
    return {
      success: true,
      message,
      result
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;

    return {
      success: false,
      message: apiError?.response?.data?.message || 'An error occurred',
      errors: apiError?.response?.data?.errors,
    };
  }
};

export const verifyEmail = async (data: EmailVerificationData, dispatch: AppDispatch): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/email-verify`,
      method: "post",
      data,
    });
    const { message, result } = respData.data;
    subscribe(result.user._id);
    dispatch(signIn(result.token));
    dispatch(setUser(result.user));
    dispatch(setWallet(result.wallet));
    await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: result.token }),
    });
    return {
      success: true,
      message,
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;

    return {
      success: false,
      message: apiError?.response?.data?.message || 'An error occurred',
      errors: apiError?.response?.data?.errors,
    };
  }
};

export const getLocation = async (): Promise<LoginHistory | false> => {
  try {
    let loginHistory: any = {};
    let respData: any = await axios({
      url: `${getFreeIpApiBaseUrl()}/api/json`,
      method: "get",
    });
    if (respData) {
      const browserRes = browser();
      respData = respData?.data;
      const data = respData as any;
      loginHistory.countryName = data.countryName;
      loginHistory.countryCode = data.countryCode;
      loginHistory.ipaddress = data.ipAddress;
      loginHistory.region = data.regionName;
      loginHistory.country_code = data.country_code;
      loginHistory.timezone = data.timeZones;
      loginHistory.country_capital = data.country_capital;
      loginHistory.city = data.cityName;
      loginHistory.country = data.countryName;
      loginHistory.browsername = browserRes.name;
      loginHistory.ismobile = browserRes.mobile;
      loginHistory.os = browserRes.os;
      return loginHistory as LoginHistory;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const resendOTP = async (data: ResendOTPData): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/resend-otp`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getUser = async (): Promise<ApiResponse<User>> => {
  try {
    let respData = await axios({
      method: "get",
      url: `${getApiBaseUrl()}/api/v1/user/get-user`,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};
