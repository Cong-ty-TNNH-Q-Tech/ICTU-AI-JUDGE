import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
  const { loading, error, loginWithGoogle, isAuthenticated } = useAuthVM();
  const navigate = useNavigate();
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Đã login thì redirect về /challenges
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/challenges', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (token: string) => {
    setSdkError(null);
    try {
      await loginWithGoogle(token);
      navigate('/challenges', { replace: true });
    } catch (err) {
      // Lỗi nghiệp vụ đã được useAuthVM set vào state `error`
      console.error('Login failed:', err);
    }
  };

  const handleGoogleError = (msg: string) => {
    setSdkError(msg);
  };

  const displayError = error || sdkError;

  return (
    <div className="flex flex-col w-full p-8 pt-4 pb-6">
      <div className="text-center mb-8">
        <h1 className="text-[2.5rem] font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 mb-2 leading-tight">
          Chào mừng<br/>trở lại!
        </h1>
        <p className="text-slate-400 text-sm">Đăng nhập để tham gia thi đấu AI</p>
      </div>
      
      <div className="mb-6">
        <GoogleLoginButton 
          onSuccess={handleGoogleSuccess} 
          onError={handleGoogleError}
          loading={loading}
        />
      </div>
      
      {/* Error Banner with Slide Animation */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${displayError ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm text-left">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{displayError}</span>
        </div>
      </div>
      
      <div className="pt-4 mt-6 border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Chỉ dành cho tài khoản @ictu.edu.vn
        </div>
      </div>
      

    </div>
  );
};

export default LoginPage;
