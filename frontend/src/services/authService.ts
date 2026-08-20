/**
 * Auth Service — Gọi API Auth endpoints.
 * Thành viên KHÔNG gọi apiClient trực tiếp trong component/viewmodel,
 * phải đi qua Service layer này.
 */
import { apiClient } from '../core/apiClient';
import type { GoogleLoginRequest, UserResponse } from '../models/api.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export const authService = {
  /**
   * UC01 — Đăng nhập bằng Google OAuth.
   * Backend set JWT vào HttpOnly Cookie, trả về UserResponse.
   */
  async googleLogin(payload: GoogleLoginRequest): Promise<UserResponse> {
    const { data } = await apiClient.post<UserResponse>('/auth/google-login', payload);
    return data;
  },

  /** UC01 — Đăng xuất: xóa Cookie phía server. */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>('/users/me');
    return data;
  },

  async login(payload: LoginRequest): Promise<UserResponse> {
    const { data } = await apiClient.post<UserResponse>('/auth/login', payload);
    return data;
  },

  async forgotPassword(payload: { email: string }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', payload);
    return data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>('/users/me/password', payload);
    return data;
  },

  async register(payload: import('../models/api.types').RegisterRequest): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/register', payload);
    return data;
  },

  async verifyOtp(payload: import('../models/api.types').VerifyOTPRequest): Promise<UserResponse> {
    const { data } = await apiClient.post<UserResponse>('/auth/verify-otp', payload);
    return data;
  },
};
