/**
 * useAuthVM — ViewModel cho Auth (UC01).
 * [OWNER] Thành viên phụ trách: Auth Module
 * Kết nối authService + useAuthStore.
 */
import { useCallback, useState } from 'react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store';

export function useAuthVM() {
  const { user, isAuthenticated, setUser, logout: clearStore } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = useCallback(async (googleToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.googleLogin({ google_token: googleToken });
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      clearStore();
      setLoading(false);
    }
  }, [clearStore]);

  const initUser = useCallback(async () => {
    /** Gọi khi app khởi động để restore session từ HttpOnly Cookie. */
    if (isAuthenticated) return;
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      // Cookie hết hạn — không làm gì, user chưa đăng nhập
    }
  }, [isAuthenticated, setUser]);

  const mockAdminLogin = useCallback(() => {
    setUser({
      id: 'mock-admin-id',
      email: 'admin@ictu.edu.vn',
      full_name: 'Admin (Mock)',
      role: 'ADMIN'
    });
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    loginWithGoogle,
    logout,
    initUser,
    mockAdminLogin,
  };
}
