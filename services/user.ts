import config from "@/config/config";
import axios, { handleResp, axiosNoCredentials } from "@/config/axios";
import { setUser } from "@/store/slices/auth/userSlice";
import {
  UpdateUserData,
  ApiResponse,
  User,
  TradeOverview,
  Position,
  TradeHistory,
  Transaction,
  WalletSettings,
  UserNotificationSettings,
  Comment,
  TransactionHistoryParams,
  TradeHistoryParams,
  AppDispatch,
  ApiError
} from "@/types";

function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;
  }
  return ""; // Use Next.js proxy in development
}
export const getUserData = async (dispatch: AppDispatch): Promise<ApiResponse<User>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-user`,
      method: "get",
    });
    const { result } = respData.data;

    dispatch(setUser(result));
    return handleResp(respData, "success");
  } catch (error: unknown) {
    console.log(error, "error")
    return handleResp(error, "error");
  }
};

export const getUserById = async (id: string): Promise<ApiResponse<User>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-user/id/${id.replace("@", "")}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {

    return handleResp(error, "error");
  }
};

export const getTradeOverviewById = async (id: string): Promise<ApiResponse<TradeOverview>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/user-trade-overview/id/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getTradeOverview = async (): Promise<ApiResponse<TradeOverview>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/user-trade-overview`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const updateUserData = async (data: UpdateUserData): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/update-user`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getPositions = async (): Promise<ApiResponse<Position[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-history`,
      method: "post",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getTradeHistory = async (data: TradeHistoryParams): Promise<ApiResponse<TradeHistory[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/trade-history/user/${data?.id}?page=${data.page}&limit=${data.limit}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getUserTradeHistory = async (data: { id: string }): Promise<ApiResponse<TradeHistory[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/trade-history/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getInfoCards = async (): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/info-cards`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const setUserEmailNotification = async (data: UserNotificationSettings): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-user-email-notification`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const setInAppNotification = async (data: UserNotificationSettings): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-in-app-notification`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const setWalletSettings = async (data: WalletSettings): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-wallet-settings`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getWalletSettings = async (): Promise<ApiResponse<WalletSettings>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-wallet-settings`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getPositionsByEvtId = async (data: { id: string }): Promise<ApiResponse<Position[]>> => {
  try {
    let respData = await axiosNoCredentials({
      url: `${getApiBaseUrl()}/api/v1/user/positions/event/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getOpenOrdersByEvtId = async (data: { id: string }): Promise<ApiResponse> => {
  try {
    let respData = await axiosNoCredentials({
      url: `${getApiBaseUrl()}/api/v1/user/open-orders/event/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const addUserName = async (data: { userName: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/add-user-name`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const deleteComment = async (data: { id: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/${data?.id}`,
      method: "delete",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getCurrentValue = async (): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/current-value`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const transactionHistory = async (data: TransactionHistoryParams): Promise<ApiResponse<Transaction[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/transaction-history`,
      method: "get",
      params: data,
    });
    if (data.export) {
      return handleResp(respData, "success");
    }
    return handleResp(respData, "success");
  } catch (err: unknown) {
    return handleResp(err, "error");
  }
}

export const getCoinList = async (): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-coin-list`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getNotifications = async (): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/notifications`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};
