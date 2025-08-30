import config from "@/config/config";

// Helper to get API base URL (use full URL for all requests to avoid middleware issues)
function getApiBaseUrl() {
  // Always use full backend URL for server-side requests to avoid malformed URL errors
  // Next.js middleware and SSR context require absolute URLs
  return config.backendURL;
}
import axios, { handleResp } from "@/config/axios";

export const getPositionHistory = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-history`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getPositionsById = async (id: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-history/user/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getOpenOrders = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/open-position`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getClosedPnL = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/closedPnL`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getUserPnL = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-value?timeframe=${data}`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};
