/**
 * Axios HTTP Client — Core config.
 * Tự động gửi credentials (HttpOnly Cookie) với mọi request.
 * Thành viên KHÔNG tạo axios instance riêng, luôn dùng apiClient này.
 */
import axios from 'axios';
import type { ApiError } from '../models/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function extractErrorMessage(apiErr: ApiError | undefined, error: unknown): string {
  if (apiErr?.detail) {
    if (typeof apiErr.detail === 'string') return apiErr.detail;
    if (Array.isArray(apiErr.detail) && apiErr.detail.length > 0) {
      return apiErr.detail.map((e: { msg?: string }) => e.msg || '').join('; ');
    }
  }
  if (error instanceof Error) return error.message;
  return 'Đã có lỗi xảy ra';
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,     // [SECURITY] Tự động gửi HttpOnly Cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

// ---- Response Interceptor — Xử lý lỗi toàn cục ----
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiErr = error.response?.data as ApiError | undefined;

    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Xóa Zustand store khỏi localStorage để phá vòng lặp redirect:
      // Nếu không xóa → login page thấy isAuthenticated=true → redirect lại → loop
      try {
        localStorage.removeItem('ictu-auth');
      } catch { /* ignore */ }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message = extractErrorMessage(apiErr, error);
    return Promise.reject(new Error(message));
  }
);
