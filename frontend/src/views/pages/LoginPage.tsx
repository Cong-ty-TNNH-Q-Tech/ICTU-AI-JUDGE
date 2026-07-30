import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthVM } from '../../viewmodels/useAuthVM';
<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
  const { loading, loginWithGoogle } = useAuthVM();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (token: string) => {
    try {
      const userData = await loginWithGoogle(token);
      // Khôi phục đường dẫn trước khi bị 401
      // Validate: chỉ chấp nhận absolute path (starts with "/"), không chấp nhận
      // protocol-relative URL (//) — chống Open Redirect nếu attacker ghi vào sessionStorage
      const redirectPath = sessionStorage.getItem('ictu-redirect-after-login');
      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        sessionStorage.removeItem('ictu-redirect-after-login');
        navigate(redirectPath);
        return;
      }
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/challenges');
      }
    } catch (e) {
      useToastStore.getState().showToast(
        'Đăng nhập Google thất bại: ' + String(e),
        'error',
        5000
      );
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-background-dark px-3 text-slate-400 dark:text-slate-500 font-medium">
            Đăng nhập bằng
          </span>
        </div>
=======
import { useAuthStore } from '../../store';
import type { UserResponse } from '../../models/api.types';

const LoginPage = () => {
  const { loading } = useAuthVM();
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleDevLogin = (role: 'STUDENT' | 'ADMIN') => {
    const mockUser: UserResponse = {
      id: role === 'ADMIN' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
      email: role === 'ADMIN' ? 'admin@ictu.edu.vn' : 'sinhvien@ictu.edu.vn',
      full_name: role === 'ADMIN' ? 'Quản trị viên (Dev Admin)' : 'Nguyễn Văn A (Dev Student)',
      role: role,
      is_active: true,
      student_id: role === 'ADMIN' ? 'ADMIN001' : 'DTC205123456',
    };
    setUser(mockUser);
    navigate(role === 'ADMIN' ? '/admin' : '/challenges');
  };

  return (
    <div className="px-8 pb-8 pt-2 animate-fade-in space-y-4">
      <button
        disabled
        className="w-full flex items-center justify-center gap-3 bg-surface dark:bg-surface-dark-hover border border-surface-200 dark:border-gray-700 text-content-primary dark:text-content-dark-primary py-3 px-4 rounded-lg font-medium text-[14px] hover:shadow-card-hover hover:border-surface-300 dark:hover:border-gray-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin"></span>
        ) : (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </button>

      {/* DEV QUICK LOGIN BUTTONS */}
      <div className="pt-2 border-t border-dashed border-surface-200 dark:border-gray-700">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-500 mb-2 text-center">
          ⚡ DEV QUICK ACCESS (TEST UI)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDevLogin('STUDENT')}
            className="w-full py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-[13px] shadow-sm hover:shadow transition-all text-center"
          >
            👨‍🎓 Login Sinh viên
          </button>
          <button
            type="button"
            onClick={() => handleDevLogin('ADMIN')}
            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-[13px] shadow-sm hover:shadow transition-all text-center"
          >
            👑 Login Admin
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-surface-100 dark:border-gray-800">
        <p className="text-[12px] text-content-tertiary text-center leading-relaxed">
          Only <span className="font-medium text-content-secondary dark:text-content-dark-secondary">@ictu.edu.vn</span> accounts are permitted.
          <br />Google OAuth integration coming soon.
        </p>
>>>>>>> Stashed changes
      </div>

      {/* Google Login Button */}
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        loading={loading}
      />

      {/* Terms */}
      <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        Bằng việc đăng nhập, bạn đồng ý với{' '}
        <span className="text-primary-600 dark:text-primary-400 font-medium">Điều khoản sử dụng</span>
        {' '}và{' '}
        <span className="text-primary-600 dark:text-primary-400 font-medium">Chính sách bảo mật</span>
        {' '}của ICTU AI Judge.
      </p>
    </div>
  );
};

export default LoginPage;

