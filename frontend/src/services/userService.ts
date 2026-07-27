/**
 * User Service — Gọi API Profile endpoints (Issue #30).
 */
import { apiClient } from '../core/apiClient';
import type { UserProfile, UpdateProfileRequest } from '../models/api.types';

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
    const { data } = await apiClient.post<{ avatar_url: string }>(
      '/users/me/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
