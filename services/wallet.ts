import config from "@/config/config";

// Helper to get API base URL (use proxy in dev, full URL in prod)
function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;
  }
  return ""; // Use Next.js proxy in development
}
import axios, { handleResp } from "@/config/axios";
import { setWallet } from "@/store/slices/wallet/dataSlice";
import { setUser } from "@/store/slices/auth/userSlice";

export const userDeposit = async (data: any, dispatch: any) => {
    try {
      let respData = await axios({
        url: `${getApiBaseUrl()}/api/v1/user/user-deposit`,
        method: "post",
        data,
      });
      const { wallet,user } = respData.data;
      console.log(user,wallet,"user");
      dispatch(setWallet(wallet));
       dispatch(setUser(user));
      return handleResp(respData, "success");
    } catch (error: any) {
      return handleResp(error, "error");
    }
};

export const addressCheck = async (data: any) => {
    try {
      let respData = await axios({
        url: `${getApiBaseUrl()}/api/v1/user/address-check`,
        method: "post",
        data,
      });
      return handleResp(respData, "success");
    } catch (error: any) {
      return handleResp(error, "error");
    }
};

export const saveWalletEmail = async (data: any) => {
  try {
    let respData = await axios({
      method: "post",
      url: `${getApiBaseUrl()}/api/v1/user/save-wallet-email`,
      data,
    });
    return handleResp(respData, "success");
  } catch (error) {
    return handleResp(error, "error");
  }
};


export const withdrawRequest = async (data: any,dispatch: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/withdraw-request`,
      method: "post",
      data,
    });
    const { wallet } = respData.data;
    console.log(wallet,"walletwallet");
    dispatch(setWallet(wallet));
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};