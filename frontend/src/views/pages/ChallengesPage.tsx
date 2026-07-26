import React from 'react';
import { useChallengeListVM } from '../../viewmodels/useChallengeVM';

const ChallengesPage = () => {
  // Use VM hook to verify it imports correctly
  const { challenges, loading, error } = useChallengeListVM();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách bài thi</h1>
      
      <div className="bg-surface-dark border border-slate-800 rounded-xl p-8 text-center">
        {loading ? (
          <p className="text-slate-400">Đang tải...</p>
        ) : error ? (
          <p className="text-red-400">Lỗi: {error}</p>
        ) : (
          <div className="py-12">
            <h3 className="text-xl text-white font-medium mb-2">Coming Soon</h3>
            <p className="text-slate-400 mb-6">Chức năng hiển thị danh sách bài thi đang được phát triển.</p>
            <p className="text-sm text-slate-500">Số bài thi (từ API mock/empty): {challenges.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
