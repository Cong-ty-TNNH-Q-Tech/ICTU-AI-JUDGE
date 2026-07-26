import React from 'react';
import IctuLogo from '../../assets/ictu-logo.png';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#0F2027] flex items-center justify-center relative overflow-hidden p-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[25rem] h-[25rem] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Main card */}
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
        {/* Brand header */}
        <div className="w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-accent"></div>
        
        <div className="p-8 pb-0 text-center flex flex-col items-center relative">
          <div className="absolute top-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
          <img src={IctuLogo} alt="ICTU Logo" className="h-20 w-auto mb-4 object-contain relative z-10 drop-shadow-md" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-wide">
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

