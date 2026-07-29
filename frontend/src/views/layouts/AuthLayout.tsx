import React from 'react';
import IctuLogo from '../../assets/ictu-logo.png';
import ErrorBoundary from '../components/ErrorBoundary';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-background-dark flex items-center justify-center font-inter relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400" />

      <div className="relative z-10 w-full max-w-[420px] mx-4 animate-fade-in-up">
        {/* Card */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm p-8 lg:p-10">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <img src={IctuLogo} alt="ICTU" className="h-16 w-auto mx-auto mb-5" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Chào mừng trở lại
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Đăng nhập vào ICTU AI Judge để tham gia thi đấu
            </p>
          </div>

          {/* Login form content injected here */}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Powered by <span className="font-semibold text-slate-500 dark:text-slate-400">ICTU AI Club</span> — Q-Tech Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
