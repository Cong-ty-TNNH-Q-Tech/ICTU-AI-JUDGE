import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChallengeListVM } from '../../viewmodels/useChallengeVM';
import type { Challenge } from '../../models/api.types';

const getStatusConfig = (c: Challenge) => {
  const now = new Date();
  if (c.status === 'DRAFT') return { label: 'Upcoming', cls: 'badge-warning' };
  if (now < new Date(c.start_time)) return { label: 'Upcoming', cls: 'badge-warning' };
  if (c.end_time && now > new Date(c.end_time)) return { label: 'Completed', cls: 'badge-danger' };
  return { label: 'Active', cls: 'badge-success' };
};

const getTimeRemaining = (end: string | null) => {
  if (!end) return 'Không giới hạn';
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  return d > 0 ? `${d}d ${h}h remaining` : `${h}h remaining`;
};

type Filter = 'all' | 'active' | 'upcoming' | 'completed';

const ChallengesPage = () => {
  const [page, setPage] = useState(1);
  const { challenges: api, meta, loading } = useChallengeListVM({ page, size: 9 });
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
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-content-primary dark:text-content-dark-primary tracking-tight">
          Competitions
        </h1>
        <p className="text-[15px] text-content-secondary dark:text-content-dark-secondary mt-1">
          Grow your data science skills by competing in AI challenges
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
              filter === f.key
                ? 'bg-content-primary dark:bg-content-dark-primary text-surface dark:text-surface-dark shadow-sm'
                : 'text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-gray-800'
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[13px] text-content-tertiary">{filtered.length} competitions</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl"></div>)}
        </div>
      ) : (
        <>
        {filtered.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <p className="text-content-tertiary text-sm">No competitions found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filtered.map(c => {
              const status = getStatusConfig(c);
              return (
                <Link key={c.id} to={`/challenges/${c.id}`}
                  className="card flex items-start gap-5 p-5 group">
                  {/* Left color indicator */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                    c.type === 'COMPETITION' ? 'bg-amber-400' : 'bg-primary-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h3 className="text-[15px] font-semibold text-content-primary dark:text-content-dark-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {c.title}
                      </h3>
                    </div>
                    <p className="text-[13px] text-content-secondary dark:text-content-dark-secondary line-clamp-1 mb-3">
                      {c.description}
                    </p>
                    <div className="flex items-center gap-4 text-[12px] text-content-tertiary">
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                      {c.type === 'COMPETITION' && <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Featured</span>}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                        {c.metric_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                        Up to {c.max_team_size}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {getTimeRemaining(c.end_time)}
                      </span>
                    </div>
                  </div>

                  <svg className="w-5 h-5 text-content-tertiary group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* Pagination controls */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-surface dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-content-secondary dark:text-content-dark-secondary">
              Page {page} of {meta.total_pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
              disabled={page === meta.total_pages}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-surface dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default ChallengesPage;
