/**
 * WhitelistManageModal — Quản lý Whitelist thí sinh cho bài thi COMPETITION (Issue #91).
 *
 * Chức năng:
 * 1. Hiển thị bảng danh sách thí sinh hiện đang có trong Whitelist (có phân trang).
 * 2. Form Textarea để Admin nhập User IDs (mỗi ID một dòng hoặc phân cách bằng dấu phẩy).
 * 3. Loading Spinners + Toast thông báo (dùng hệ thống Toast hiện tại của dự án).
 */
import React, { useState } from 'react';
import { useWhitelistVM } from '../../../viewmodels/useAdminVM';
import type { Challenge } from '../../../models/api.types';

interface Props {
  isOpen: boolean;
  challenge: Challenge;
  onClose: () => void;
}

const WhitelistManageModal: React.FC<Props> = ({ isOpen, challenge, onClose }) => {
  const {
    participants,
    total,
    totalPages,
    page,
    setPage,
    loading,
    adding,
    addByUserIds,
  } = useWhitelistVM(challenge.id);

  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = async () => {
    const success = await addByUserIds(inputValue);
    if (success) setInputValue(''); // Clear textarea khi thêm thành công
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter để submit nhanh
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-gray-900 border border-surface-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary dark:text-content-dark-primary">
                Quản lý Whitelist
              </h2>
              <p className="text-[12px] text-content-tertiary mt-0.5 line-clamp-1">
                {challenge.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-content-tertiary hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Đóng modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== Body (2 panel) ===== */}
        <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-surface-200 dark:divide-gray-800">

          {/* ----- Panel trái: Danh sách thí sinh hiện tại ----- */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Sub-header */}
            <div className="px-5 py-3 bg-surface-50 dark:bg-gray-900/50 border-b border-surface-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <span className="text-[12px] font-semibold text-content-secondary dark:text-content-dark-secondary uppercase tracking-wider">
                Danh sách Whitelist
              </span>
              <span className="text-[12px] text-content-tertiary font-medium">
                {total} thí sinh
              </span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-5 space-y-2.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton h-11 w-full rounded-lg" />
                  ))}
                </div>
              ) : participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-content-secondary dark:text-content-dark-secondary">
                    Whitelist trống
                  </p>
                  <p className="text-[12px] text-content-tertiary mt-1">
                    Thêm thí sinh bằng form bên phải.
                  </p>
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] text-content-tertiary uppercase tracking-wider bg-surface-50 dark:bg-gray-900/40 sticky top-0">
                      <th className="px-4 py-2.5 text-left font-medium">Họ tên</th>
                      <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Email</th>
                      <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                    {participants.map((p) => (
                      <tr key={p.user_id} className="hover:bg-surface-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar placeholder */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {p.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <p className="font-medium text-content-primary dark:text-content-dark-primary truncate max-w-[140px]">
                              {p.full_name || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-content-secondary dark:text-content-dark-secondary truncate max-w-[160px] hidden sm:table-cell">
                          {p.email}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.is_approved
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {p.is_approved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-5 py-3 border-t border-surface-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-content-tertiary">
                  Trang <strong>{page}</strong> / {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 text-[11px] font-medium bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 rounded-lg hover:bg-surface-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-2.5 py-1 text-[11px] font-medium bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 rounded-lg hover:bg-surface-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ----- Panel phải: Form thêm thí sinh ----- */}
          <div className="w-72 flex-shrink-0 flex flex-col">
            {/* Sub-header */}
            <div className="px-5 py-3 bg-surface-50 dark:bg-gray-900/50 border-b border-surface-100 dark:border-gray-800 flex-shrink-0">
              <span className="text-[12px] font-semibold text-content-secondary dark:text-content-dark-secondary uppercase tracking-wider">
                Thêm thí sinh
              </span>
            </div>

            <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
              {/* Hướng dẫn */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-3.5 py-3 text-[12px] text-blue-700 dark:text-blue-300 leading-relaxed">
                <p className="font-semibold mb-1">📋 Hướng dẫn:</p>
                <ul className="space-y-1 list-disc list-inside text-[11px]">
                  <li>Nhập <strong>User ID</strong> (UUID) của thí sinh</li>
                  <li>Mỗi ID một dòng, hoặc phân cách bằng dấu phẩy</li>
                  <li>Có thể nhập nhiều ID cùng lúc</li>
                  <li>Nhấn <kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-[10px]">Ctrl+Enter</kbd> để gửi nhanh</li>
                </ul>
              </div>

              {/* Textarea nhập User IDs */}
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[12px] font-medium text-content-secondary dark:text-content-dark-secondary">
                  User IDs <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={adding}
                  placeholder={`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\nyyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy\n...`}
                  rows={8}
                  className="flex-1 resize-none w-full text-[12px] font-mono bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 rounded-xl px-3.5 py-3 text-content-primary dark:text-content-dark-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
                />
                {/* Counter */}
                <p className="text-[11px] text-content-tertiary text-right">
                  {inputValue.split(/[\n,\s]+/).filter(s => s.trim().length > 0).length} ID đã nhập
                </p>
              </div>

              {/* Nút thêm */}
              <button
                onClick={handleAdd}
                disabled={adding || inputValue.trim() === ''}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 text-white text-[13px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Thêm vào Whitelist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-6 py-3.5 border-t border-surface-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-surface-50 dark:bg-gray-900/40">
          <p className="text-[11px] text-content-tertiary">
            💡 Chỉ thí sinh trong Whitelist mới có thể đăng ký tham gia bài thi COMPETITION này.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-200 dark:border-gray-700 text-[12px] font-medium text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhitelistManageModal;
