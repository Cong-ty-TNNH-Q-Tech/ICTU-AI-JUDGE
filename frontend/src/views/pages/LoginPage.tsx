import React, { useState } from 'react';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { apiClient } from '../../core/apiClient';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';

const DEV_USER_ID = '09c9aec1-4dba-49a7-8316-4b982852e7c0'; // Nguyen Tran Anh Hoang

const LoginPage = () => {
  const { loading, loginWithGoogle } = useAuthVM();
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [devLoading, setDevLoading] = useState(false);
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development';

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const { data } = await apiClient.post('/auth/dev-login', { user_id: DEV_USER_ID });
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        avatar_url: null,
        is_active: true,
      });
      navigate('/challenges');
    } catch (e) {
      alert('Dev login thất bại: ' + String(e));
    } finally {
      setDevLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    try {
      await loginWithGoogle(token);
      navigate('/challenges');
    } catch (e) {
      alert('Đăng nhập Google thất bại: ' + String(e));
    }
  };

  return (
    <div className="px-8 pb-8 pt-2 animate-fade-in">
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        loading={loading}
      />

      {/* DEV ONLY — Dev Login button */}
      {isDev && (
        <button
          onClick={handleDevLogin}
          disabled={devLoading}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 py-2.5 px-4 rounded-lg font-medium text-[13px] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-200 disabled:opacity-60"
        >
          {devLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-amber-800 rounded-full animate-spin" />
          ) : (
            <span>🛠️</span>
          )}
          Dev Login (Nguyen Tran Anh Hoang)
        </button>
      )}

    </div>
  );
};

export default LoginPage;
