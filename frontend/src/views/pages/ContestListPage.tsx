import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContestVM } from '../../viewmodels/useContestVM';
import type { Contest } from '../../models/api.types';
import HeroIllustration from '../../assets/hero-competition.png';

const getStatusConfig = (c: Contest) => {
  const now = new Date();
  if (c.status === 'DRAFT') return { label: 'Upcoming', color: 'amber' };
  if (now < new Date(c.start_time)) return { label: 'Upcoming', color: 'amber' };
  if (c.end_time && now > new Date(c.end_time)) return { label: 'Completed', color: 'slate' };
  return { label: 'Active', color: 'emerald' };
};

const getTimeRemaining = (end: string | null) => {
  if (!end) return 'Không giới hạn';
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  return d > 0 ? `${d} ngày ${h} giờ còn lại` : `${h} giờ còn lại`;
};

const stripMarkdown = (md?: string | null) => {
  if (!md) return 'Chua co mo ta';
  return md
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/[#_*~`>]/g, '')
    .trim();
};

/** Windowed pagination: toi da 7 nut, hien '...' neu co khoang trong. */
function buildPageWindow(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [];
  const left = Math.max(2, currentPage - 2);
  const right = Math.min(totalPages - 1, currentPage + 2);

  pages.push(1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('...');
  pages.push(totalPages);
  return pages;
}

const ContestListPage = () => {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const { contests, totalPages, isLoading, fetchContests } = useContestVM();

  useEffect(() => {
    fetchContests(page, PAGE_SIZE);
  }, [fetchContests, page]);

  return (
    <div className="animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 mb-8">
        <div className="flex items-center justify-between px-8 py-10 lg:px-12 lg:py-12">
          <div className="max-w-xl">
            <h1 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Kỳ Thi Đánh Giá Năng Lực AI
            </h1>
            <p className="mt-3 text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Các kỳ thi lớn do trường tổ chức. Tham gia và ghi danh lên bảng vàng.
            </p>
          </div>
          <div className="hidden lg:block flex-shrink-0 ml-8">
            <img
              src={HeroIllustration}
              alt="AI Contests"
              className="w-52 h-52 object-contain animate-float select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
        {/* Decorative gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-500" />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {contests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Chưa có cuộc thi nào</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Hãy quay lại sau để xem các kỳ thi sắp diễn ra.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((contest) => {
                const statusConfig = getStatusConfig(contest);
                const timeRemaining = getTimeRemaining(contest.end_time);
                return (
                  <div key={contest.id} className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                    <div className="flex flex-col flex-grow p-5 lg:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase bg-${statusConfig.color}-50 dark:bg-${statusConfig.color}-500/10 text-${statusConfig.color}-700 dark:text-${statusConfig.color}-400 border border-${statusConfig.color}-200/50 dark:border-${statusConfig.color}-500/20`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                          {timeRemaining}
                        </span>
                      </div>

                      <Link to={`/contests/${contest.id}`} className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2">
                          {contest.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 flex-grow">
                        {stripMarkdown(contest.description)}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-slate-800/60 mt-auto">
                        <Link
                          to={`/contests/${contest.id}`}
                          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Windowed Pagination — max 7 nut, khong overflow */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Trang truoc
              </button>
              <div className="flex items-center gap-1">
                {buildPageWindow(page, totalPages).map((p, idx) =>
                  p === '...'
                    ? <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm select-none">...</span>
                    : <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === p
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >{p}</button>
                )}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContestListPage;
