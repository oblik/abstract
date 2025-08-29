import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";
import { ApiResponse, Position } from "@/types";

export const getPositionHistory = async (data: { userId?: string }): Promise<ApiResponse<Position[]>> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/position-history`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getPositionsById = async (id: string): Promise<ApiResponse<Position[]>> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/position-history/user/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getOpenOrders = async (data: { userId?: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/open-position`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getClosedPnL = async (data: { userId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/closedPnL`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getUserPnL = async (timeframe: string): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/position-value?timeframe=${timeframe}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};