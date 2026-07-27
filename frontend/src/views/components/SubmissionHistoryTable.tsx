import React, { useState } from 'react';
import type { Submission } from '../../models/api.types';
import SubmissionStatusBadge from './SubmissionStatusBadge';

interface SubmissionHistoryTableProps {
  submissions: Submission[];
  loading: boolean;
  error?: string | null;
  isPolling: boolean;
  togglingPrivateId: string | null;
  onTogglePrivate: (id: string, currentValue: boolean) => void;
}
const SubmissionHistoryTable: React.FC<SubmissionHistoryTableProps> = ({
  submissions,
  loading,
  error,
  isPolling,
  togglingPrivateId,
  onTogglePrivate,
}) => {
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedErrorId === id) setExpandedErrorId(null);
    else setExpandedErrorId(id);
  };

  return (
    <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Lịch sử nộp bài</h3>
        {isPolling && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Đang cập nhật...
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Đang tải lịch sử...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Chưa có bài nộp nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-4 px-4 font-medium w-12 text-center">STT</th>
                <th className="py-4 px-4 font-medium">Thời gian</th>
                <th className="py-4 px-4 font-medium text-right">Điểm Public</th>
                <th className="py-4 px-4 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-center">Tính Private</th>
                <th className="py-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, index) => {
                const isToggling = togglingPrivateId === sub.id;
                const isExpanded = expandedErrorId === sub.id;

                return (
                  <React.Fragment key={sub.id}>
                    <tr className={`border-b border-slate-800/50 hover:bg-white/5 transition-colors ${index === 0 ? 'animate-fadeIn' : ''}`}>
                      <td className="py-4 px-4 text-center text-sm text-slate-500">
                        {submissions.length - index}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-300">
                        {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white">
                        {sub.public_score !== null ? sub.public_score.toFixed(4) : '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <SubmissionStatusBadge status={sub.status} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <label className={`inline-flex items-center cursor-pointer ${isToggling ? 'opacity-50' : ''}`}>
                          <input
                            type="checkbox"
                            aria-label={`Chọn bài nộp ${sub.id} để tính điểm chung cuộc`}
                            className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
                            checked={sub.is_selected_for_private}
                            disabled={togglingPrivateId !== null}
                            onChange={() => onTogglePrivate(sub.id, sub.is_selected_for_private)}
                          />
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {sub.status === 'FAILED' && sub.error_message && (
                          <button
                            onClick={() => toggleExpand(sub.id)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Xem chi tiết lỗi"
                          >
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && sub.status === 'FAILED' && sub.error_message && (
                      <tr className="bg-red-500/5 border-b border-slate-800/50">
                        <td colSpan={6} className="py-3 px-6">
                          <div className="flex items-start gap-2 text-sm text-red-400">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="break-all">{sub.error_message}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistoryTable;
