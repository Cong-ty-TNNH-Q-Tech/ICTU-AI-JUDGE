import React, { useState } from 'react';
import { useAdminChallengesVM } from '../../../viewmodels/useAdminVM';
import type { Challenge, ChallengeCreateRequest, ChallengeUpdateRequest } from '../../../models/api.types';
import ChallengeForm from '../../components/admin/ChallengeForm';

const ChallengeManagePage = () => {
  const { challenges, loading, error, exportingId, createChallenge, updateChallenge, deleteChallenge, downloadLeaderboardCSV } = useAdminChallengesVM();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);

  const handleSubmit = async (data: ChallengeCreateRequest, groundTruthFile?: File, metricScriptFile?: File, publicTestSplitRatio: number = 30) => {
    if (editing) await updateChallenge(editing.id, data as ChallengeUpdateRequest, groundTruthFile, metricScriptFile, publicTestSplitRatio);
    else await createChallenge(data, groundTruthFile!, metricScriptFile, publicTestSplitRatio);
    setIsFormOpen(false);
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary">All Competitions</h2>
          <p className="text-[12px] text-content-tertiary mt-0.5">{challenges.length} total</p>
        </div>
        <button onClick={() => { setEditing(null); setIsFormOpen(true); }} className="btn-primary text-[13px] py-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Competition
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full"></div>)}</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] text-content-tertiary uppercase tracking-wider bg-surface-50 dark:bg-gray-900/40">
                <th className="px-5 py-2.5 text-left font-medium">Title</th>
                <th className="px-5 py-2.5 text-left font-medium">Metric</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">Period</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {challenges.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-content-tertiary">No competitions yet</td></tr>
              ) : (
                challenges.map(c => (
                  <tr key={c.id} className="hover:bg-surface-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-content-primary dark:text-content-dark-primary mb-0.5">{c.title}</p>
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.is_public ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {c.is_public ? 'Public' : 'Competition'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-primary-600 dark:text-primary-400">{c.metric_name}</td>
                    <td className="px-5 py-3.5"><span className={`badge ${c.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-content-tertiary text-[12px]">
                      {new Date(c.start_time).toLocaleDateString('vi-VN')} — {new Date(c.end_time).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button 
                          onClick={() => downloadLeaderboardCSV(c.id, 'public')} 
                          disabled={exportingId === c.id}
                          className="btn-ghost text-[12px] py-1.5 px-2.5 text-primary-600 dark:text-primary-400 disabled:opacity-50"
                        >
                          {exportingId === c.id ? 'Exporting...' : 'Export Pub'}
                        </button>
                        <button 
                          onClick={() => downloadLeaderboardCSV(c.id, 'private')} 
                          disabled={exportingId === c.id}
                          className="btn-ghost text-[12px] py-1.5 px-2.5 text-purple-600 dark:text-purple-400 disabled:opacity-50"
                        >
                          {exportingId === c.id ? 'Exporting...' : 'Export Priv'}
                        </button>
                        <button onClick={() => { setEditing(c); setIsFormOpen(true); }} className="btn-ghost text-[12px] py-1.5 px-2.5">Edit</button>
                        <button onClick={() => deleteChallenge(c.id)} className="btn-ghost text-[12px] py-1.5 px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && <ChallengeForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default ChallengeManagePage;
