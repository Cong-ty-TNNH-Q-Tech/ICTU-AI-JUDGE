import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChallengeDetailVM } from '../../viewmodels/useChallengeVM';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { challenge, loading, error } = useChallengeDetailVM(id || '');

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/challenges" className="text-slate-400 hover:text-white transition-colors">
          &larr; Quay lại
        </Link>
        <h1 className="text-3xl font-bold">Chi tiết bài thi {id}</h1>
      </div>
      
      <div className="bg-surface-dark border border-slate-800 rounded-xl p-8 text-center">
        {loading ? (
          <p className="text-slate-400">Đang tải...</p>
        ) : error ? (
          <p className="text-red-400">Lỗi: {error}</p>
        ) : (
          <div className="py-12">
            <h3 className="text-xl text-white font-medium mb-2">Coming Soon</h3>
            <p className="text-slate-400">Trang chi tiết bài thi đang được phát triển.</p>
            {challenge && <p className="mt-4 text-primary">{challenge.title}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetailPage;
