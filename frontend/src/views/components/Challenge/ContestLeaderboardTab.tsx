import React from 'react';
import { useContestLeaderboardVM } from '../../../viewmodels/useContestLeaderboardVM';

interface Props {
  challengeId: string;
}

export const ContestLeaderboardTab: React.FC<Props> = ({ challengeId }) => {
  const { data, loading, error, leaderboardType, setLeaderboardType } = useContestLeaderboardVM(challengeId);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 lg:px-8 py-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Bảng xếp hạng Tổng {leaderboardType === 'public' ? '(Public)' : '(Private)'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Dựa trên điểm số từ {data?.child_challenges?.length || 0} bài thi con
            </p>
          </div>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setLeaderboardType('public')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                leaderboardType === 'public' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setLeaderboardType('private')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                leaderboardType === 'private' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Private
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="font-medium">Đang tải bảng xếp hạng tổng...</p>
        </div>
      ) : !data || data.leaderboard.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Chưa có đội nào lọt BXH Tổng</h4>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                <th className="py-3.5 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-16">#</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Đội</th>
                {/* Dynamic Columns for child challenges */}
                {data.child_challenges.map(child => (
                  <th key={child.id} className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right max-w-[150px] truncate" title={child.title}>
                    {child.title}
                  </th>
                ))}
                <th className="py-3.5 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {data.leaderboard.map((entry) => {
                const rankBg = entry.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                  : entry.rank === 2 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  : entry.rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' : '';

                return (
                  <tr key={entry.team_id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 w-16">
                      {entry.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${rankBg}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm pl-1.5">{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">{entry.team_name}</td>
                    
                    {/* Scores for child challenges */}
                    {data.child_challenges.map(child => (
                      <td key={child.id} className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400 tabular-nums text-sm">
                        {entry.scores[child.id] !== undefined ? entry.scores[child.id].toFixed(4) : '—'}
                      </td>
                    ))}

                    <td className="py-3.5 px-6 text-right font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                      {entry.total_score.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
