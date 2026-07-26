import React from 'react';
import IctuLogo from '../../assets/ictu-logo.png';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Main card */}
      <div className="relative z-10 w-full max-w-md bg-surface-dark/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Brand header */}
        <div className="w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
        <div className="p-8 pb-0 text-center flex flex-col items-center">
          <img src={IctuLogo} alt="ICTU Logo" className="h-16 w-auto mb-4 object-contain" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ICTU AI JUDGE
          </h2>
        </div>
        
        {/* Render page content */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
