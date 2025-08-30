import config from "@/config/config";

// Helper to get API base URL (use proxy in dev, full URL in prod)
function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;
  }
  return ""; // Use Next.js proxy in development
}
import axios, { handleResp } from "@/config/axios";
import {
  EventsQueryParams,
  EventSearchData,
  Event,
  PlaceOrderData,
  OrderBook,
  PriceHistoryPoint,
  PriceHistoryParams,
  Comment,
  PostCommentData,
  ApiResponse,
  PaginatedResponse
} from "@/types";

export const getEvents = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/paginate/${data.id}?page=${data.page}&limit=${data.limit}&banner=${data.banner}&tag=${data.tag}&status=${data.status}`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getEventsByRegex = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/search?regex=${data.regex}&page=${data.page}&limit=${data.limit}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getCategories = async () => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/category`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getEventById = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/market/${data.id}`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const placeOrder = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const cancelOrder = async (id: string): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order/cancel/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getOrderBook = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order/books/${data.id}`,
      method: "get",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getPriceHistory = async (id: string, params: PriceHistoryParams): Promise<ApiResponse<PriceHistoryPoint[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/price-history/${id}`,
      method: "get",
      params,
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getForecastHistory = async (id: string, params: PriceHistoryParams): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/forecast-history/${id}`,
      method: "get",
      params,
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

//get comments
export const getComments = async (eventId: string): Promise<ApiResponse<Comment[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/event/${eventId}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getCommentsPaginate = async (eventId: string, data: { page: number; limit: number }): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/event/paginate/${eventId}`,
      method: "get",
      params: data,
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const postComment = async (data: PostCommentData): Promise<ApiResponse<Comment>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getTagsByCategory = async (id: string): Promise<ApiResponse<string[]>> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/tags/${id}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
};

export const getSeriesByEvent = async (id: string): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/series/event/${id}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
}

export const positionClaim = async (id: string): Promise<ApiResponse> => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order/claim-position/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: unknown) {
    return handleResp(error, "error");
  }
}