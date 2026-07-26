import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import type { RefreshTokenResponse } from '../types';
import { getUserFriendlyError, logError } from '../utils/errorHelper';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

interface ApiErrorPayload {
  message?: string;
  errors?: unknown;
}

/** Type mở rộng của Error để mang thêm thông tin phân loại lỗi */
export interface ApiError extends Error {
  statusCode?: number;
  errors?: unknown;
  /** Message thân thiện đã được map — dùng để hiển thị toast/UI, không bao giờ chứa thông tin kỹ thuật */
  userMessage?: string;
}

interface AuthRetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
}

type LegacyApiData<T> = T & { data?: T };

function getStoredToken(key: 'accessToken' | 'refreshToken') {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

function setStoredToken(key: 'accessToken' | 'refreshToken', value?: string) {
  if (typeof window === 'undefined' || !value) {
    return;
  }

  localStorage.setItem(key, value);
}

function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const authConfig = config as AuthRetryConfig;
  if (authConfig.skipAuth) {
    return config;
  }

  const token = getStoredToken('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as AuthRetryConfig | undefined;
    const requestUrl = originalRequest?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/login');
    const isAuthRequest = isLoginRequest || requestUrl.includes('/auth/refresh-token');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      const refreshToken = getStoredToken('refreshToken');

      if (refreshToken) {
        try {
          const refreshResponse = await axiosInstance.post<ApiResponse<RefreshTokenResponse>>(
            '/auth/refresh-token',
            { refreshToken },
            { skipAuthRefresh: true } as AxiosRequestConfig
          );
          const tokenData = refreshResponse.data.data;

          setStoredToken('accessToken', tokenData.accessToken);
          setStoredToken('refreshToken', tokenData.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;

          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          clearStoredAuth();
          logError('api/refresh-token', refreshErr);

          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login');
          }

          const sessionError = new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.') as ApiError;
          sessionError.statusCode = 401;
          sessionError.userMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          throw sessionError;
        }
      }
    }

    // Giữ nguyên message gốc từ BE trong .message để business logic (như captcha detection) vẫn hoạt động
    const rawMessage =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối tới máy chủ. Vui lòng thử lại.';

    const apiError = new Error(rawMessage) as ApiError;
    apiError.errors = error.response?.data?.errors;
    apiError.statusCode = error.response?.status;
    (apiError as any).url = requestUrl;
    (apiError as any).isLogin = isLoginRequest;

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
        ? 'Đăng nhập không thành công. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.'
        : 'Có lỗi xảy ra, vui lòng thử lại sau.'
    );

    throw apiError;
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<LegacyApiData<T>> {
  const res = await axiosInstance<ApiResponse<T>>(config);
  return res.data.data as LegacyApiData<T>;
}

export function get<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'GET' });
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'POST', data });
}

export function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'PATCH', data });
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'DELETE' });
}

export function buildQueryParams<T extends object>(params?: T) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}
