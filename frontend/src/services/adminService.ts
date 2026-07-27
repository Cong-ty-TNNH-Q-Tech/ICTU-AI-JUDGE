/**
 * Admin Service — Gọi API Admin endpoints (UC12).
 */
import { apiClient } from '../core/apiClient';
import type { PaginatedResponse, UserResponse } from '../models/api.types';

export const adminService = {
  /** Lấy danh sách sinh viên. */
  async getUsers(params?: {
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<UserResponse>> {
    const { data } = await apiClient.get<PaginatedResponse<UserResponse>>('/admin/users', { params });
    return data;
  },

  /** Khóa/Mở khóa tài khoản sinh viên. */
  async updateUserStatus(id: string, is_active: boolean): Promise<void> {
    await apiClient.patch(`/admin/users/${id}`, { is_active });
  },
};
