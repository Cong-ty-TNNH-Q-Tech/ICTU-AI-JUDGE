import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { useToastStore } from '../../store/toastStore';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAuthStore } from '../../store';
import type { UserResponse } from '../../models/api.types';

const LoginPage = () => {
  const { loading, loginWithGoogle } = useAuthVM();
  const setUser = useAuthStore((state) => state.setUser);
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
      {/* Google Login Button */}
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        loading={loading}
      />

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
        </p>
      </div>

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
