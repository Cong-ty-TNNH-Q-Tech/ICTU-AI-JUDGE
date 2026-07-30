import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChallengeListVM } from '../../viewmodels/useChallengeVM';
import type { Challenge } from '../../models/api.types';
import HeroIllustration from '../../assets/hero-competition.png';

const getStatusConfig = (c: Challenge) => {
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

const getTypeGradient = (type: string) => {
  if (type === 'COMPETITION') return 'from-amber-400 to-orange-500';
  return 'from-primary-400 to-primary-600';
};

const stripMarkdown = (md?: string | null) => {
  if (!md) return 'Chưa có mô tả';
  return md
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // images
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
    .replace(/\n+/g, ' ') // replace newlines
    .replace(/[#_*~`>]/g, '') // catch remaining
    .trim();
};

type Filter = 'all' | 'active' | 'upcoming' | 'completed';

const StatusBadge = ({ label, color }: { label: string; color: string }) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[color] || styles.slate}`}>
      {color === 'emerald' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />}
      {label}
    </span>
  );
};

const ChallengesPage = () => {
  const [page, setPage] = useState(1);
  const { challenges: api, meta, loading } = useChallengeListVM({ page, size: 12 });
  const [filter, setFilter] = useState<Filter>('all');

  const challenges = api;

  const filtered = challenges.filter(c => {
    if (filter === 'all') return true;
    const now = new Date();
    if (filter === 'active') return c.status === 'PUBLISHED' && now >= new Date(c.start_time) && (!c.end_time || now <= new Date(c.end_time));
    if (filter === 'upcoming') return c.status === 'DRAFT' || now < new Date(c.start_time);
    return c.end_time ? now > new Date(c.end_time) : false;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Đang diễn ra' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'completed', label: 'Đã kết thúc' },
  ];

  return (
    <div className="animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 mb-8">
        <div className="flex items-center justify-between px-8 py-10 lg:px-12 lg:py-12">
          <div className="max-w-xl">
            <h1 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Competitions
            </h1>
            <p className="mt-3 text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Thử thách bản thân với các bài toán AI thực tế.
              <br className="hidden sm:block" />
              Thi đấu cùng các bạn sinh viên ICTU để nâng cao kỹ năng Data Science.
            </p>
          </div>
          <div className="hidden lg:block flex-shrink-0 ml-8">
            <img
              src={HeroIllustration}
              alt="AI Competition"
              className="w-52 h-52 object-contain animate-float select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
        {/* Decorative gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-500" />
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tabular-nums">
          {filtered.length} cuộc thi
        </span>
      </div>

      {/* ===== COMPETITION LIST ===== */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-[108px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0l-3-3m3 3l-3 3M5.625 5.25H9.75m-4.125 0A2.625 2.625 0 003 7.875v8.25A2.625 2.625 0 005.625 18.75h12.75A2.625 2.625 0 0021 16.125V7.875a2.625 2.625 0 00-2.625-2.625H14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                Không tìm thấy cuộc thi nào
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Thử chọn bộ lọc khác để xem thêm kết quả.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
              {filtered.map(c => {
                const status = getStatusConfig(c);
                return (
                  <Link
                    key={c.id}
                    to={`/challenges/${c.id}`}
                    className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1.5 border border-surface-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-500/50"
                  >
                    {/* Top Banner Area */}
                    <div className={`relative h-36 w-full bg-gradient-to-br ${getTypeGradient(c.type)}/10 flex items-center justify-center overflow-hidden`}>
                      {/* Decorative Circles */}
                      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${getTypeGradient(c.type)} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
                      <div className={`absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br ${getTypeGradient(c.type)} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
                      
                      {/* Icon */}
                      <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${getTypeGradient(c.type)} flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                        {c.type === 'COMPETITION' ? (
                          <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Badges overlaid on banner */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {c.type === 'COMPETITION' && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/90 backdrop-blur-sm text-white px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                            Ranked
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm backdrop-blur-sm ${
                          status.color === 'emerald' ? 'bg-emerald-500/90 text-white' : 
                          status.color === 'amber' ? 'bg-amber-500/90 text-white' : 
                          'bg-slate-600/90 text-white'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex-1 flex flex-col p-6 lg:p-7 relative bg-white dark:bg-surface-dark">
                      {/* Title & Description */}
                      <div className="mb-6">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-3 line-clamp-2 leading-tight">
                          {c.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {stripMarkdown(c.description)}
                        </p>
                      </div>
                      
                      {/* Spacer to push metadata to bottom */}
                      <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                              </svg>
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate">{c.metric_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Nhóm ≤ {c.max_team_size}</span>
                          </div>

                          <div className="flex items-center gap-2.5 col-span-2">
                            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{getTimeRemaining(c.end_time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow indicator bottom right */}
                      <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Trang trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
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

export default ChallengesPage;
