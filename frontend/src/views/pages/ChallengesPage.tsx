import React, { useState } from 'react';
import { useChallengeListVM } from '../../viewmodels/useChallengeVM';
import ChallengeCard from '../components/ChallengeCard';

const ChallengesPage = () => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  
  const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
  const { challenges, meta, loading, error, refetch } = useChallengeListVM({ 
    status: statusParam, 
    page: currentPage, 
    size: 9 
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Bài Thi AI</h1>
          <p className="text-slate-400">Tham gia thử thách và nâng cao kỹ năng của bạn</p>
        </div>
        
        {/* Filter Bar */}
        <div className="flex bg-surface-dark p-1 rounded-xl border border-slate-800">
          {(['ALL', 'PUBLISHED', 'ARCHIVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status 
                  ? 'bg-primary/20 text-primary shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-white mb-2">Đã có lỗi xảy ra</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={refetch}
            className="px-6 py-2.5 bg-surface-dark border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-dark border border-slate-800 rounded-2xl p-6 h-[260px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation"></div>
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-slate-800 rounded-md"></div>
                      <div className="w-20 h-6 bg-slate-800 rounded-md"></div>
                    </div>
                    <div className="w-16 h-6 bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="w-3/4 h-6 bg-slate-800 rounded-lg mb-3"></div>
                  <div className="w-full h-4 bg-slate-800 rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-slate-800 rounded mb-6"></div>
                  <div className="mt-auto flex justify-between">
                    <div className="w-24 h-5 bg-slate-800 rounded"></div>
                    <div className="w-12 h-5 bg-slate-800 rounded-full"></div>
                  </div>
                </div>
              ))
            ) : challenges.length === 0 ? (
              // Empty State
              <div className="col-span-full bg-surface-dark border border-slate-800 rounded-2xl p-16 text-center">
                <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy bài thi</h3>
                <p className="text-slate-400">Thử thay đổi bộ lọc hoặc quay lại sau nhé.</p>
              </div>
            ) : (
              // Data Grid
              challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && meta && meta.total_pages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-surface-dark border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.total_pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-dark border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(meta.total_pages, p + 1))}
                disabled={currentPage === meta.total_pages}
                className="p-2 rounded-lg bg-surface-dark border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengesPage;
