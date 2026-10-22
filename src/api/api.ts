import { isAuthSessionEnding, notifyAuthSession } from "../utils/authSession";
import { EvaluationTransport } from "./evaluationTransport";
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { RefreshTokenResponse } from "../types";
import { getUserFriendlyError, logError } from "../utils/errorHelper";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

interface ApiErrorPayload {
  message?: string | string[];
  errors?: unknown;
}

/** Type mở rộng của Error để mang thêm thông tin phân loại lỗi */
export interface ApiError extends Error {
  statusCode?: number;
  errors?: unknown;
  /** Message thân thiện đã được map — dùng để hiển thị toast/UI, không bao giờ chứa thông tin kỹ thuật */
  userMessage?: string;
  kind?:
    | "unauthenticated"
    | "forbidden"
    | "conflict"
    | "network"
    | "server"
    | "validation";
  url?: string;
  isLogin?: boolean;
}

interface AuthRetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
}

type LegacyApiData<T> = T & { data?: T };

function getStoredToken(key: "accessToken" | "refreshToken") {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function setStoredToken(key: "accessToken" | "refreshToken", value?: string) {
  if (typeof window === "undefined" || !value) {
    return;
  }

  localStorage.setItem(key, value);
}

function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  notifyAuthSession();
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const authConfig = config as AuthRetryConfig;
  if (authConfig.skipAuth) {
    return config;
  }

  const token = getStoredToken("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshFlight: Promise<RefreshTokenResponse> | undefined;
let refreshFlightToken: string | undefined;
async function refreshSession(refreshToken: string) {
  if (!refreshFlight || refreshFlightToken !== refreshToken) {
    refreshFlightToken = refreshToken;
    const flight = axiosInstance
      .post<ApiResponse<RefreshTokenResponse>>(
        "/auth/refresh-token",
        { refreshToken },
        { skipAuth: true, skipAuthRefresh: true } as AxiosRequestConfig,
      )
      .then((response) => {
        // A refresh completing after logout/account switch must not restore that session.
        if (isAuthSessionEnding() || getStoredToken("refreshToken") !== refreshToken) {
          throw new Error("Session changed during refresh");
        }
        const tokens = response.data.data;
        setStoredToken("accessToken", tokens.accessToken);
        setStoredToken("refreshToken", tokens.refreshToken);
        notifyAuthSession();
        return tokens;
      })
      .finally(() => {
        if (refreshFlight === flight) {
          refreshFlight = undefined;
          refreshFlightToken = undefined;
        }
      });
    refreshFlight = flight;
  }
  return refreshFlight;
}
function expireSession() {
  clearStoredAuth();
  if (typeof window !== "undefined" && window.location.pathname !== "/login")
    window.location.replace("/login");
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as AuthRetryConfig | undefined;
    const requestUrl = originalRequest?.url || "";
    const isLoginRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/login");
    const isAuthRequest =
      isLoginRequest || requestUrl.includes("/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      const refreshToken = getStoredToken("refreshToken");

      if (refreshToken) {
        try {
          const tokenData = await refreshSession(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;

          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          if (getStoredToken("refreshToken") === refreshToken) expireSession();
          logError("api/refresh-token", refreshErr);

          const sessionError = new Error(
            "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          ) as ApiError;
          sessionError.statusCode = 401;
          sessionError.kind = "unauthenticated";
          sessionError.userMessage =
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          throw sessionError;
        }
      }
    }

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !originalRequest?.skipAuth
    )
      expireSession();

    // Giữ nguyên message gốc từ BE trong .message để business logic vẫn hoạt động
    const responseMessage =
      error.response?.data?.message ||
      error.message ||
      "Không thể kết nối tới máy chủ. Vui lòng thử lại.";

    const rawMessage = Array.isArray(responseMessage)
      ? responseMessage.join("\n")
      : responseMessage;
    const apiError = new Error(rawMessage) as ApiError;
    apiError.errors = error.response?.data?.errors;
    apiError.statusCode = error.response?.status;
    apiError.url = requestUrl;
    apiError.isLogin = isLoginRequest;
    const status = apiError.statusCode;
    apiError.kind =
      status === 401
        ? "unauthenticated"
        : status === 403
          ? "forbidden"
          : status === 409
            ? "conflict"
            : !status
              ? "network"
              : status >= 500
                ? "server"
                : "validation";

    // Gắn sẵn userMessage (friendly) — các component dùng toast nên ưu tiên field này
    apiError.userMessage = getUserFriendlyError(
      {
        message: rawMessage,
        statusCode: error.response?.status,
        errors: error.response?.data?.errors,
        url: requestUrl,
        isLogin: isLoginRequest,
      },
      isLoginRequest
        ? "Đăng nhập không thành công. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu."
        : "Có lỗi xảy ra, vui lòng thử lại sau.",
    );

    if (apiError.statusCode === 409 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("evaluation_conflict", {
          detail: { message: apiError.userMessage },
        }),
      );
    }
    throw apiError;
  },
);

export interface EvaluationApiConfig extends AxiosRequestConfig {
  evaluationTransport?: EvaluationTransport;
}
export function createEvaluationTransport(scope: string) {
  let storage: Storage | undefined;
  let identity = "anonymous";
  if (typeof window !== "undefined") {
    try {
      storage = window.sessionStorage;
      identity = String(
        JSON.parse(localStorage.getItem("user") || "{}")?.id || "anonymous",
      );
    } catch {
      /* Storage unavailable. */
    }
  }
  return new EvaluationTransport(
    storage,
    `evaluation-intent:${identity}:${scope}`,
  );
}
export function bindEvaluationApi(transport: EvaluationTransport) {
  return {
    get: <T>(url: string, config?: EvaluationApiConfig) =>
      get<T>(url, { ...config, evaluationTransport: transport }),
    post: <T>(url: string, data?: unknown, config?: EvaluationApiConfig) =>
      post<T>(url, data, { ...config, evaluationTransport: transport }),
    patch: <T>(url: string, data?: unknown, config?: EvaluationApiConfig) =>
      patch<T>(url, data, { ...config, evaluationTransport: transport }),
    del: <T>(url: string, config?: EvaluationApiConfig) =>
      del<T>(url, { ...config, evaluationTransport: transport }),
  };
}
let evaluationTransport: EvaluationTransport | undefined;
let transportIdentity: string | undefined;
function getEvaluationTransport() {
  let identity = "anonymous";
  let storage: Storage | undefined;
  if (typeof window !== "undefined") {
    try {
      identity = String(
        JSON.parse(localStorage.getItem("user") || "{}")?.id || "anonymous",
      );
      storage = window.sessionStorage;
    } catch {
      /* Browser storage may be restricted. */
    }
  }
  if (!evaluationTransport || identity !== transportIdentity) {
    evaluationTransport = new EvaluationTransport(
      storage,
      `evaluation-intent:${identity}`,
    );
    transportIdentity = identity;
  }
  return evaluationTransport;
}
export async function request<T>(
  config: EvaluationApiConfig,
): Promise<LegacyApiData<T>> {
  const { evaluationTransport: scopedTransport, ...requestConfig } = config;
  try {
    return await (scopedTransport ?? getEvaluationTransport()).run(
      requestConfig,
      async (prepared) => {
        const res = await axiosInstance<ApiResponse<T>>(prepared);
        return res.data.data as LegacyApiData<T>;
      },
    );
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.statusCode === 409 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("evaluation_conflict", {
          detail: { message: apiError.userMessage || apiError.message },
        }),
      );
    }
    throw error;
  }
}

export function get<T>(url: string, config?: EvaluationApiConfig) {
  return request<T>({ ...config, url, method: "GET" });
}

export function post<T>(
  url: string,
  data?: unknown,
  config?: EvaluationApiConfig,
) {
  return request<T>({ ...config, url, method: "POST", data });
}

export function patch<T>(
  url: string,
  data?: unknown,
  config?: EvaluationApiConfig,
) {
  return request<T>({ ...config, url, method: "PATCH", data });
}

export function del<T>(url: string, config?: EvaluationApiConfig) {
  return request<T>({ ...config, url, method: "DELETE" });
}

export function buildQueryParams<T extends object>(params?: T) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}
