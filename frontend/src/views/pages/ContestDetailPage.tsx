import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useContestDetailVM } from '../../viewmodels/useContestVM';
import type { Challenge } from '../../models/api.types';

// ------------------------------------------------------------------
// Helper — lấy trạng thái + màu cho badge challenge
// ------------------------------------------------------------------
const getChallengeStatus = (c: Challenge) => {
  const now = new Date();
  if (c.status === 'DRAFT') return { label: 'Sắp diễn ra', color: 'amber' };
  if (now < new Date(c.start_time)) return { label: 'Sắp diễn ra', color: 'amber' };
  if (c.end_time && now > new Date(c.end_time)) return { label: 'Đã kết thúc', color: 'slate' };
  return { label: 'Đang diễn ra', color: 'emerald' };
};

const getTimeLabel = (end: string | null) => {
  if (!end) return 'Không giới hạn';
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Đã kết thúc';
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  return d > 0 ? `${d} ngày ${h} giờ còn lại` : `${h} giờ còn lại`;
};

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
const ContestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contest, challenges, loading, error } = useContestDetailVM(id);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải thông tin kỳ thi...</p>
      </div>
    );
  }

  // Error / not found state
  if (error || !contest) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-10 text-center">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{error || 'Không tìm thấy kỳ thi'}</h3>
        <Link to="/contests" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusStyle =
    contest.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' :
    contest.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400' :
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400';

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12 space-y-6">

      {/* ===== HEADER ===== */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${statusStyle}`}>
              {contest.status}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Bắt đầu: {new Date(contest.start_time).toLocaleDateString('vi-VN')}
            </span>
            {contest.end_time && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Kết thúc: {new Date(contest.end_time).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            {contest.title}
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
            <ReactMarkdown>
              {contest.description || 'Chưa có mô tả chi tiết cho kỳ thi này.'}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* ===== CHALLENGES CON ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Các bài thi trong kỳ thi
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums font-medium">
            {challenges.length} bài thi
          </span>
        </div>

        {challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Chưa có bài thi nào trong kỳ thi này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges.map((c) => {
              const cs = getChallengeStatus(c);
              return (
                <Link
                  key={c.id}
                  to={`/challenges/${c.id}`}
                  className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-500/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-${cs.color}-50 dark:bg-${cs.color}-500/10 text-${cs.color}-700 dark:text-${cs.color}-400`}>
                        {cs.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {c.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                      {c.title}
                    </h3>

                    {/* Meta */}
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                        </svg>
                        {c.metric_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getTimeLabel(c.end_time)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestDetailPage;
