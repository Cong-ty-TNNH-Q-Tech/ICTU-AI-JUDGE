import React, { useState, useEffect } from 'react';

interface ChallengeTimerProps {
  endTime: string;
  variant?: 'compact' | 'full';
  className?: string;
}

const ChallengeTimer: React.FC<ChallengeTimerProps> = ({ endTime, variant = 'compact', className }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    if (!endTime) return;
    const end = new Date(endTime).getTime();
    if (isNaN(end)) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isEnded: false,
      });
    };

    calculateTimeLeft(); // Initial call
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!endTime) return <span className="text-slate-500">--:--:--</span>;

  if (timeLeft.isEnded) {
    return (
      <div className={`text-red-400 font-medium ${variant === 'full' ? 'text-lg' : 'text-sm'}`}>
        Đã kết thúc
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 font-medium ${className || 'text-sm text-amber-400'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timeLeft.days > 0 ? `${timeLeft.days} ngày ${timeLeft.hours}h` : `${timeLeft.hours}h ${timeLeft.minutes}m`}
      </div>
    );
  }

  // Full variant
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center rounded-lg shadow-inner">
          <span className="text-lg font-bold text-white">{timeLeft.days.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Ngày</span>
      </div>
      <span className="text-xl font-bold text-slate-500 mb-4">:</span>
      <div className="flex flex-col items-center">
        <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center rounded-lg shadow-inner">
          <span className="text-lg font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Giờ</span>
      </div>
      <span className="text-xl font-bold text-slate-500 mb-4">:</span>
      <div className="flex flex-col items-center">
        <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center rounded-lg shadow-inner">
          <span className="text-lg font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Phút</span>
      </div>
      <span className="text-xl font-bold text-slate-500 mb-4">:</span>
      <div className="flex flex-col items-center">
        <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center rounded-lg shadow-inner">
          <span className="text-lg font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Giây</span>
      </div>
    </div>
  );
};

export default ChallengeTimer;
