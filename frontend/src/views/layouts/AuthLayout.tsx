import React from 'react';
import IctuLogo from '../../assets/ictu-logo.png';
import ErrorBoundary from '../components/ErrorBoundary';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] bg-primary-100/40 dark:bg-primary-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] bg-accent-100/40 dark:bg-accent-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="card p-0 overflow-hidden animate-fade-in-up">
          <div className="h-1 w-full bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <div className="p-8 pb-4 text-center">
            <img src={IctuLogo} alt="ICTU" className="h-12 w-auto mx-auto mb-4" />
            <h2 className="text-xl font-bold text-content-primary dark:text-content-dark-primary">ICTU AI Judge</h2>
            <p className="text-[13px] text-content-tertiary mt-1">AI Competition Platform for ICTU Students</p>
          </div>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
