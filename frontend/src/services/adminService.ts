/**
 * Admin Service — Gọi API Admin endpoints (UC12).
 */
import { apiClient } from '../core/apiClient';
import type { PaginatedResponse, UserResponse, UserRole } from '../models/api.types';

export const adminService = {
  /** Lấy danh sách sinh viên (có phân trang + tìm kiếm). */
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

  /** Cập nhật Role của người dùng (Student / Admin). */
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await apiClient.patch(`/admin/users/${id}`, { role });
  },

  /** Test metric script trước khi tạo bài thi. */
  async testMetric(formData: FormData): Promise<{ score: number }> {
    const { data } = await apiClient.post<{ score: number }>('/admin/test-metric', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Tải xuống bảng xếp hạng dưới dạng CSV. */
  async downloadLeaderboardCSV(challengeId: string, type: 'public' | 'private'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/admin/challenges/${challengeId}/leaderboard-csv`, {
      params: { type },
      responseType: 'blob',
    });
    return data;
  },
};
