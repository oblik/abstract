import config from "@/config/config";
import { getApiBaseUrl } from "@/lib/apiHelpers";
import axios, { handleResp } from "@/config/axios";
import { ApiResponse, Position } from "@/types";

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

export const getPositionsById = async (id: string): Promise<ApiResponse<Position[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-history/user/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getOpenOrders = async (params?: any) => {
  try {
    const respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/open-position`,
      method: "get",
      params,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getClosedPnL = async (params?: any) => {
  try {
    const respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/closedPnL`,
      method: "get",
      params,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getUserPnL = async (timeframe: string) => {
  try {
    const respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/position-value`,
      method: "get",
      params: { timeframe },
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

