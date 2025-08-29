import config from "@/config/config";
import axios, { handleResp } from "@/config/axios";

export const getEvents = async (data: any) => {
  try {
    const id = data?.id ?? "all";
    const params = new URLSearchParams();
    if (data?.page != null) params.set("page", String(data.page));
    if (data?.limit != null) params.set("limit", String(data.limit));
    if (data?.banner != null && data.banner !== "") params.set("banner", String(data.banner));
    // Only pass tag when it's a specific value, not the 'all' sentinel
    if (data?.tag && data.tag !== "all") params.set("tag", String(data.tag));
    if (data?.status) params.set("status", String(data.status));

    const query = params.toString();
    const url = `${config.backendURL}/api/v1/events/paginate/${id}${query ? `?${query}` : ""}`;

  let respData = await axios({ url, method: "get", withCredentials: false });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getEventsByRegex = async (data: any) => {
    try {
      let respData = await axios({
        url: `${config.backendURL}/api/v1/events/search?regex=${data.regex}&page=${data.page}&limit=${data.limit}`,
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
        url: `${config.backendURL}/api/v1/events/category`,
        method: "get",
        withCredentials: false,
      });
      return handleResp(respData, "success");
    } catch (error: any) {
      return handleResp(error, "error");
    }
};

export const getEventById = async (data: any) => {
    try {
      let respData = await axios({
        url: `${config.backendURL}/api/v1/events/market/${data.id}`,
        method: "get",
        data,
        withCredentials: false,
      });
      return handleResp(respData, "success");
    } catch (error: any) {
      return handleResp(error, "error");
    }
};

export const placeOrder = async (data: any) => {
    try {
      let respData = await axios({
        url: `${config.backendURL}/api/v1/order`,
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
      url: `${config.backendURL}/api/v1/order/cancel/${id}`,
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
        url: `${config.backendURL}/api/v1/order/books/${data.id}`,
        method: "get",
        data,
        withCredentials: false,
      });
      return handleResp(respData, "success");
    } catch (error: any) {
      return handleResp(error, "error");
    }
};

export const getPriceHistory = async (id: string, params: any) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/events/price-history/${id}`,
      method: "get",
      params,
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getForecastHistory = async (id: string, params: any) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/events/forecast-history/${id}`,
      method: "get",
      params,
      withCredentials: false,
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
      url: `${config.backendURL}/api/v1/user/comments/event/${eventId}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const getCommentsPaginate = async (eventId: string, data: { page: number; limit: number }) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/comments/event/paginate/${eventId}`,
      method: "get",
      params: data,
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};

export const postComment = async (data: any) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/user/comments`,
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
      url: `${config.backendURL}/api/v1/events/tags/${id}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
};


export const getSeriesByEvent = async (id: string) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/events/series/event/${id}`,
      method: "get",
      withCredentials: false,
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}

export const positionClaim = async (id: string) => {
  try {
    let respData = await axios({
      url: `${config.backendURL}/api/v1/order/claim-position/${id}`,
      method: "get",
    });
    return handleResp(respData, "success");
  } catch (error: any) {
    return handleResp(error, "error");
  }
}