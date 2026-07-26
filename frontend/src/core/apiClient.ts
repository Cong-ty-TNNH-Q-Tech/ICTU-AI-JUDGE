/**
 * Axios HTTP Client — Core config.
 * Tự động gửi credentials (HttpOnly Cookie) với mọi request.
 * Thành viên KHÔNG tạo axios instance riêng, luôn dùng apiClient này.
 */
import axios from 'axios';
import type { ApiError } from '../models/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

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

    if (error.response?.status === 401) {
      // Token hết hạn — redirect về trang login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Bubble up lỗi với message từ backend
    const message = apiErr?.detail ?? error.message ?? 'Đã có lỗi xảy ra';
    return Promise.reject(new Error(message));
  }
);
