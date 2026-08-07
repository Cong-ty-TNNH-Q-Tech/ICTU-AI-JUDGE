/**
 * useAuthVM — ViewModel cho Auth (UC01).
 * [OWNER] Thành viên phụ trách: Auth Module
 * Kết nối authService + useAuthStore.
 */
import { useCallback, useState } from 'react';
import { authService, type LoginRequest } from '../services/authService';
import { useAuthStore } from '../store';
import { useToastStore } from '../store/toastStore';

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
      useToastStore.getState().showToast(message, 'error');
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


  const login = useCallback(async (payload: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(payload);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (payload: import('../models/api.types').RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      return await authService.register(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (payload: import('../models/api.types').VerifyOTPRequest) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.verifyOtp(payload);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xác thực OTP thất bại';
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    loginWithGoogle,
    login,
    logout,
    initUser,
    register,
    verifyOtp,
  };
}
