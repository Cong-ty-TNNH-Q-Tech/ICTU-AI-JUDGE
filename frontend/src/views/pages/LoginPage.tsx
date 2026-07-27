import React, { useState } from 'react';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { apiClient } from '../../core/apiClient';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';

const DEV_USER_ID = '09c9aec1-4dba-49a7-8316-4b982852e7c0'; // Nguyen Tran Anh Hoang

const LoginPage = () => {
  const { loading } = useAuthVM();
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
      });
      navigate('/challenges');
    } catch (e) {
      alert('Dev login thất bại: ' + String(e));
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="px-8 pb-8 pt-2 animate-fade-in">
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

      <div className="mt-6 pt-5 border-t border-surface-100 dark:border-gray-800">
        <p className="text-[12px] text-content-tertiary text-center leading-relaxed">
          Only <span className="font-medium text-content-secondary dark:text-content-dark-secondary">@ictu.edu.vn</span> accounts are permitted.
          <br />Google OAuth integration coming soon.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
