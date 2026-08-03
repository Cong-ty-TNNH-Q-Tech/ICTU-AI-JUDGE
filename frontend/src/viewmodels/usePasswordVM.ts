import { useCallback, useState } from 'react';
import { authService } from '../services/authService';
import type { ChangePasswordRequest, ResetPasswordRequest } from '../services/authService';
import { useToastStore } from '../store/toastStore';
import { isAxiosError } from 'axios';

const getErrorMessage = (err: unknown, defaultMsg: string) => {
  if (isAxiosError(err) && err.response?.data?.detail) {
    return err.response.data.detail;
  }
  return err instanceof Error ? err.message : defaultMsg;
};

export function usePasswordVM() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(async (payload: ChangePasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.changePassword(payload);
      useToastStore.getState().showToast(result.message || 'Đổi mật khẩu thành công.', 'success');
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Đổi mật khẩu thất bại');
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (payload: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.forgotPassword(payload);
      useToastStore.getState().showToast(result.message || 'Yêu cầu thành công. Vui lòng kiểm tra email.', 'success');
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Yêu cầu thất bại');
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.resetPassword(payload);
      useToastStore.getState().showToast(result.message || 'Đặt lại mật khẩu thành công.', 'success');
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Đặt lại mật khẩu thất bại');
      setError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };
}
