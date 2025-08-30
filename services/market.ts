import config from "@/config/config";


// Helper to get API base URL (use full URL for all requests to avoid middleware issues)
function getApiBaseUrl() {
  // Always use full backend URL for server-side requests to avoid malformed URL errors
  // Next.js middleware and SSR context require absolute URLs
  return config.backendURL;
}
import axios, { handleResp } from "@/config/axios";

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

export const cancelOrder = async (id: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order/cancel/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
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

export const getPriceHistory = async (id: string, params: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/price-history/${id}`,
      method: "get",
      params,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getForecastHistory = async (id: string, params: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/forecast-history/${id}`,
      method: "get",
      params,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

//get comments
export const getComments = async (eventId: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/event/${eventId}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getCommentsPaginate = async (eventId: string, data: { page: number; limit: number }) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments/event/paginate/${eventId}`,
      method: "get",
      params: data
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const postComment = async (data: any) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/user/comments`,
      method: "post",
      data,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getTagsByCategory = async (id: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/tags/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}


export const getSeriesByEvent = async (id: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/events/series/event/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}

export const positionClaim = async (id: string) => {
  try {
    let respData = await axios({
      url: `${getApiBaseUrl()}/api/v1/order/claim-position/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}