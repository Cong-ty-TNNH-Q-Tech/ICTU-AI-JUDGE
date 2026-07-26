/**
 * Auth Service — Gọi API Auth endpoints.
 * Thành viên KHÔNG gọi apiClient trực tiếp trong component/viewmodel,
 * phải đi qua Service layer này.
 */
import { apiClient } from '../core/apiClient';
import type { GoogleLoginRequest, UserResponse } from '../models/api.types';

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

  /** Lấy thông tin user hiện tại từ Cookie (dùng khi reload page). */
  async getMe(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>('/users/me');
    return data;
  },
};
