import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";
import { setWallet } from "@/store/slices/wallet/dataSlice";
import { setUser } from "@/store/slices/auth/userSlice";
import { ApiResponse, Wallet, User, AppDispatch, ApiError } from "@/types";

export const userDeposit = async (data: { amount: number; currency: string }, dispatch: AppDispatch): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/user-deposit`,
      method: "post",
      data,
    });
    const { wallet, user } = respData.data;

    dispatch(setWallet(wallet));
    dispatch(setUser(user));
    return handleResp(respData, "success");
  console.log(user, wallet, "user")
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const addressCheck = async (data: { address: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/address-check`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const saveWalletEmail = async (data: { email: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      method: "post",
      url: `${config.backendURL}/api/v1/user/save-wallet-email`,
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const withdrawRequest = async (data: { amount: number; address: string; currency: string }, dispatch: AppDispatch): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/withdraw-request`,
      method: "post",
      data,
    });
    const { wallet } = respData.data;

    dispatch(setWallet(wallet));
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};