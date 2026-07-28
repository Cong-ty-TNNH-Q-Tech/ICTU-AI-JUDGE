/**
 * Admin Service — Gọi API Admin endpoints (UC12).
 */
import { apiClient } from '../core/apiClient';
import type { PaginatedResponse, UserResponse, UserRole } from '../models/api.types';

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

  /** Cấp/Đổi quyền sinh viên. */
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/role`, { role });
  },

  /** Xuất Bảng xếp hạng chung cuộc ra file CSV. */
  async exportLeaderboard(challengeId: string, type: 'public' | 'private' = 'private'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
      `/admin/challenges/${challengeId}/export-leaderboard`,
      { params: { type }, responseType: 'blob', timeout: 60_000 }
    );
    return data;
  },

  /** Chạy thử Metric với file mẫu. */
  async testMetric(formData: FormData): Promise<{ score: number }> {
    const { data } = await apiClient.post<{ score: number }>('/admin/challenges/test-metric', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
