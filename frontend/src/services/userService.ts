import { apiClient } from '../core/apiClient';
import type { UserProfile, UpdateProfileRequest, UserSolution } from '../models/api.types';

export const userService = {
  /** GET /users/{id}/profile — Xem hồ sơ công khai */
  async getProfile(userId: string): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>(`/users/${userId}/profile`);
    return data;
  },

  /** PATCH /users/me/profile — Cập nhật Github/LinkedIn */
  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>('/users/me/profile', payload);
    return data;
  },

  /** POST /users/me/avatar — Upload ảnh đại diện */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    // Xóa Content-Type mặc định (application/json) để browser tự set
    // 'multipart/form-data; boundary=...' với đúng boundary
    const { data } = await apiClient.post<{ avatar_url: string }>(
      '/users/me/avatar',
      formData,
      {
        headers: { 'Content-Type': undefined },
        transformRequest: (data) => data, // bypass axios JSON serialization
      },
    );
    return data;
  },

  /** GET /users/{id}/solutions — Danh sách solutions đã đăng */
  async getUserSolutions(userId: string): Promise<UserSolution[]> {
    const { data } = await apiClient.get<UserSolution[]>(`/users/${userId}/solutions`);
    return data;
  },
};
