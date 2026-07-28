import React, { useState } from 'react';
import type { Submission } from '../../models/api.types';
import SubmissionStatusBadge from './SubmissionStatusBadge';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border border-surface-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Lịch sử nộp bài</h3>
          <p className="text-sm text-slate-500 mt-1">Quản lý và chọn bài thi để tính điểm Private</p>
        </div>
        {isPolling && (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-500/20 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Đang cập nhật...
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p className="font-medium">Đang tải lịch sử...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-1">Chưa có bài nộp nào</h4>
          <p className="text-sm text-slate-500 max-w-sm">Hãy nộp file dự đoán đầu tiên của đội bạn để xem điểm số trên bảng xếp hạng.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">STT</div>
            <div className="col-span-3">Thời gian nộp</div>
            <div className="col-span-2 text-center">Trạng thái</div>
            <div className="col-span-3 text-right">Điểm Public</div>
            <div className="col-span-3 text-center">Tính Private</div>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {submissions.map((sub, index) => {
                const isToggling = togglingPrivateId === sub.id;
                const isExpanded = expandedErrorId === sub.id;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={sub.id}
                    className={`bg-white dark:bg-slate-800/40 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${
                      sub.is_selected_for_private 
                        ? 'border-primary-400 dark:border-primary-500/50 shadow-primary-500/10' 
                        : 'border-surface-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:px-6 md:py-5 items-center">
                      <div className="col-span-1 hidden md:flex justify-center text-sm font-bold text-slate-400">
                        #{submissions.length - index}
                      </div>
                      
                      <div className="col-span-12 md:col-span-3 flex flex-col">
                        <span className="md:hidden text-xs font-semibold text-slate-400 uppercase mb-1">Thời gian nộp</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </span>
                        {sub.execution_time_ms !== null && (
                          <span className="text-xs text-slate-500 mt-0.5">{sub.execution_time_ms} ms</span>
                        )}
                      </div>

                      <div className="col-span-6 md:col-span-2 flex justify-start md:justify-center">
                        <SubmissionStatusBadge status={sub.status} />
                      </div>

                      <div className="col-span-6 md:col-span-3 flex flex-col items-end">
                        <span className="md:hidden text-xs font-semibold text-slate-400 uppercase mb-1">Điểm Public</span>
                        <span className={`text-lg font-black tracking-tight ${sub.public_score !== null ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                          {sub.public_score !== null ? sub.public_score.toFixed(5) : '-'}
                        </span>
                      </div>

                      <div className="col-span-12 md:col-span-3 flex items-center justify-between md:justify-center mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50">
                        <span className="md:hidden text-sm font-medium text-slate-600 dark:text-slate-400">Dùng tính Private</span>
                        <div className="flex items-center gap-3">
                          <label className={`relative inline-flex items-center cursor-pointer ${isToggling ? 'opacity-50' : ''}`}>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={sub.is_selected_for_private}
                              disabled={togglingPrivateId !== null}
                              onChange={() => onTogglePrivate(sub.id, sub.is_selected_for_private)}
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                          
                          {sub.status === 'FAILED' && sub.error_message && (
                            <button
                              onClick={() => toggleExpand(sub.id)}
                              className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              title="Xem chi tiết lỗi"
                            >
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Error Details Expandable Area */}
                    <AnimatePresence>
                      {isExpanded && sub.status === 'FAILED' && sub.error_message && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-red-50 dark:bg-red-500/5 border-t border-red-100 dark:border-red-500/10"
                        >
                          <div className="p-4 md:px-6 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="font-mono whitespace-pre-wrap break-all text-xs leading-relaxed">
                              {sub.error_message}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistoryTable;
