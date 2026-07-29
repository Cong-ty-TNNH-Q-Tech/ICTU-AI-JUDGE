import React from 'react';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
  const { loading, loginWithGoogle } = useAuthVM();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (token: string) => {
    try {
      const userData = await loginWithGoogle(token);
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/challenges');
      }
    } catch (e) {
      alert('Đăng nhập Google thất bại: ' + String(e));
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
