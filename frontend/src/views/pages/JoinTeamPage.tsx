import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useJoinTeamVM } from '../../viewmodels/useTeamVM';

const JoinTeamPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  
  const { joining, joined, error, teamInfo, handleJoin } = useJoinTeamVM();

  useEffect(() => {
    if (token && !joined && !error) {
      handleJoin(token);
    }
  }, [token, handleJoin, joined, error]);

  // Auto-redirect countdown sau khi join thành công
  useEffect(() => {
    if (!joined || !teamInfo) return;
    if (countdown <= 0) {
      navigate(`/challenges/${teamInfo.challenge_id}`);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [joined, countdown, teamInfo, navigate]);

  if (!token) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link mời không hợp lệ</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Thiếu token trong đường dẫn URL.</p>
        <button onClick={() => navigate('/challenges')} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all">
          Quay về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-20 animate-fade-in">
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-2xl text-center">
        
        {joining && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-slate-700 border-t-primary rounded-full animate-spin" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đang xác thực link mời...</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Vui lòng chờ trong giây lát</p>
          </div>
        )}

        {error && (
          <div className="py-8">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
            <button onClick={() => navigate('/challenges')} className="mt-6 px-6 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700">
              Xem các bài thi khác
            </button>
          </div>
        )}

        {joined && teamInfo && (
          <div className="py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Gia nhập thành công!
            </h2>
            <p className="text-gray-600 dark:text-slate-300 mb-2">
              Bạn đã trở thành viên của đội <span className="font-bold text-gray-900 dark:text-white">{teamInfo.name}</span>
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-8">
              Tự động chuyển hướng sau {countdown} giây...
            </p>
            
            <button onClick={() => navigate(`/challenges/${teamInfo.challenge_id}`)} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-md shadow-primary/20 w-full flex justify-center items-center gap-2">
              Vào bài thi ngay
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default JoinTeamPage;
