import { get, patch, post } from './api';

import type {
  CaptchaResponse,
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from '../types';

/** Lấy mã xác nhận khi đăng nhập. */
async function getCaptcha() {
  return get<CaptchaResponse>('/auth/captcha', { skipAuth: true, skipAuthRefresh: true } as any);
}

/** Đăng nhập tài khoản. */
async function login(username: string, password: string, captchaId: string, captchaCode: string) {
  return post<LoginResponse>('/auth/login', {
    username,
    password,
    captchaId,
    captchaCode,
  } satisfies LoginPayload, { skipAuth: true, skipAuthRefresh: true } as any);
}

/** Lấy thông tin tài khoản hiện tại. */
async function getMe() {
  return get<User>('/auth/me');
}

/** Giữ phiên đăng nhập hoạt động. */
async function refreshToken(refreshToken: string) {
  return post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken });
}

/** Đăng xuất tài khoản. */
async function logout(refreshToken: string, _accessToken?: string) {
  void _accessToken;
  return post<null>('/auth/logout', { refreshToken }, { skipAuthRefresh: true } as any);
}

/** Đổi mật khẩu tài khoản. */
async function changePassword(_accessToken: string, currentPassword: string, newPassword: string) {
  void _accessToken;
  return patch<{ passwordChanged: boolean; requiresLogin: boolean }>('/profile/password', {
    currentPassword,
    newPassword,
  } satisfies ChangePasswordPayload);
}

/** Lấy thông tin tài khoản cho màn cũ. */
async function getProfile(_accessToken?: string) {
  void _accessToken;
  return get<User>('/profile');
}

/** Cập nhật thông tin cá nhân dùng chung cho mọi vai trò. */
async function updateProfile(_accessTokenOrPayload: string | Record<string, unknown>, payload?: Record<string, unknown>) {
  const data = typeof _accessTokenOrPayload === 'string' ? payload : _accessTokenOrPayload;
  return patch<User>('/profile', data);
}

/** Gửi yêu cầu quên mật khẩu (nhập email/username để gửi OTP). */
async function forgotPassword(identifier: string) {
  return post<{ email?: string; message?: string }>('/auth/forgot-password', { identifier }, { skipAuth: true, skipAuthRefresh: true } as any);
}

export const API_Auth = {
  getCaptcha,
  login,
  getMe,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
};
