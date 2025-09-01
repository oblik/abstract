import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";
import { setUser } from "@/store/slices/auth/userSlice";


function getApiBaseUrl() {
  // For server-side rendering, we need to use the full backend URL
  // even in development, because SSR can't use relative URLs
  if (typeof window === "undefined") {
    // Server-side: always use full backend URL
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // Use production URL in development for SSR
  }

  // Client-side: use Next.js proxy in development, full URL in production
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;
  }
  return ""; // Use Next.js proxy routes in development
}

export const getUserData = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-user`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getUserById = async (id: string) => {
  console.log("=== getUserById service called ===");
  console.log("Raw ID parameter:", id);

  // Clean the ID by removing @ symbol
  const cleanId = id.replace("@", "");
  console.log("Cleaned ID:", cleanId);

  const url = `${getApiBaseUrl()}/api/v1/user/get-user/id/${cleanId}`;
  console.log("API URL:", url);

  try {
    let respData = await axios({
      url: url,
      method: "get",
    });
    console.log("getUserById response:", respData);
    return handleResp(respData, "success");
  } catch (error: any) {
    console.error("getUserById error:", error);
    console.error("Error status:", error?.response?.status);
    console.error("Error data:", error?.response?.data);
    return handleResp(error, "error");
  }
};
export const getTradeOverviewById = async (id: string) => {
  console.log("=== getTradeOverviewById service called ===");
  console.log("ID parameter:", id);

  const url = `${getApiBaseUrl()}/api/v1/user/user-trade-overview/id/${id}`;
  console.log("Trade overview API URL:", url);

  try {
    let respData = await axios({
      url: url,
      method: "get",
    });
    console.log("getTradeOverviewById response:", respData);
    return handleResp(respData, "success");
  } catch (error: any) {
    console.error("getTradeOverviewById error:", error);
    console.error("Error status:", error?.response?.status);
    console.error("Error data:", error?.response?.data);
    return handleResp(error, "error");
  }
};

export const getTradeOverview = async () => {

  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/user-trade-overview`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const updateUserData = async (data: object) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/update-user`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getPositions = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-history`,
      method: "post",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getTradeHistory = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/trade-history/user/${data?.id}?page=${data.page}&limit=${data.limit}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getUserTradeHistory = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/trade-history/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getInfoCards = async (data: any) => {
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


export const setUserEmailNotification = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-user-email-notification`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const setInAppNotification = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-in-app-notification`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const setWalletSettings = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/set-wallet-settings`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getWalletSettings = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-wallet-settings`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getPositionsByEvtId = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/positions/event/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getOpenOrdersByEvtId = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/open-orders/event/${data?.id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const addUserName = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/add-user-name`,
      method: "post",
      data: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const deleteComment = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/${data?.id}`,
      method: "delete",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getCurrentValue = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/current-value`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};


export const transactionHistory = async (data: any) => {
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
  } catch (err) {
    return handleResp(err, "error");
  }
}

export const getCoinList = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/get-coin-list`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getNotifications = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/notifications`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

