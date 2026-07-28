/**
 * ChallengeManagePage — Quản lý bài thi (UC09).
 *
 * Cải tiến theo Admin UX Review:
 * 1. ConfirmationModal trước khi Xóa bài thi
 * 2. Bộ lọc trạng thái (All / Published / Draft) + Pagination
 * 3. Tách biệt exportingLeaderboard state — 2 nút Export Pub & Export Priv hoạt động độc lập
 * 5. Responsive: cột Actions dùng menu Dropdown 3 chấm trên màn hình nhỏ (<768px)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAdminChallengesVM } from '../../../viewmodels/useAdminVM';
import type { Challenge, ChallengeCreateRequest, ChallengeUpdateRequest } from '../../../models/api.types';
import ChallengeForm from '../../components/admin/ChallengeForm';
import ConfirmationModal from '../../components/admin/ConfirmationModal';

// ==========================================
// Action Dropdown Component (Issue #5)
// ==========================================
interface ActionDropdownProps {
  challenge: Challenge;
  exportingLeaderboard: { id: string; type: 'public' | 'private' } | null;
  onExportPub: () => void;
  onExportPriv: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  challenge,
  exportingLeaderboard,
  onExportPub,
  onExportPriv,
  onEdit,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isExportingPub = exportingLeaderboard?.id === challenge.id && exportingLeaderboard?.type === 'public';
  const isExportingPriv = exportingLeaderboard?.id === challenge.id && exportingLeaderboard?.type === 'private';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Desktop: Hiện đủ nút */}
      <div className="hidden md:flex items-center gap-1 flex-wrap">
        <button
          onClick={onExportPub}
          disabled={isExportingPub}
          className="btn-ghost text-[12px] py-1.5 px-2.5 text-primary-600 dark:text-primary-400 disabled:opacity-50 flex items-center gap-1"
        >
          {isExportingPub && (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isExportingPub ? 'Exporting...' : 'Export Pub'}
        </button>
        <button
          onClick={onExportPriv}
          disabled={isExportingPriv}
          className="btn-ghost text-[12px] py-1.5 px-2.5 text-purple-600 dark:text-purple-400 disabled:opacity-50 flex items-center gap-1"
        >
          {isExportingPriv && (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isExportingPriv ? 'Exporting...' : 'Export Priv'}
        </button>
        <button onClick={onEdit} className="btn-ghost text-[12px] py-1.5 px-2.5">Edit</button>
        <button onClick={onDelete} className="btn-ghost text-[12px] py-1.5 px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
      </div>

      {/* Mobile: Menu 3 chấm Dropdown (Issue #5) */}
      <div className="relative md:hidden" ref={ref}>
        <button
          onClick={() => setIsOpen(v => !v)}
          className="btn-ghost p-2 text-content-secondary"
          aria-label="More actions"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 w-44 bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 animate-scale-in origin-top-right">
            <button
              onClick={() => { onExportPub(); setIsOpen(false); }}
              disabled={isExportingPub}
              className="w-full text-left px-4 py-2.5 text-[13px] text-primary-600 dark:text-primary-400 hover:bg-surface-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isExportingPub ? (
                <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              Export Public CSV
            </button>
            <button
              onClick={() => { onExportPriv(); setIsOpen(false); }}
              disabled={isExportingPriv}
              className="w-full text-left px-4 py-2.5 text-[13px] text-purple-600 dark:text-purple-400 hover:bg-surface-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isExportingPriv ? (
                <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              Export Private CSV
            </button>
            <div className="h-px bg-surface-100 dark:bg-gray-800 my-1" />
            <button
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-content-primary dark:text-content-dark-primary hover:bg-surface-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Chỉnh sửa
            </button>
            <button
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Xóa bài thi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// ChallengeManagePage
// ==========================================
const ChallengeManagePage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const {
    challenges,
    meta,
    loading,
    error,
    exportingLeaderboard,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    downloadLeaderboardCSV,
  } = useAdminChallengesVM({ status: statusFilter || undefined, page, size: PAGE_SIZE });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);

  // --- Confirmation modal state for Delete ---
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    challengeId: string;
    challengeTitle: string;
  }>({ isOpen: false, challengeId: '', challengeTitle: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (data: ChallengeCreateRequest, groundTruthFile?: File, metricScriptFile?: File) => {
    if (editing) await updateChallenge(editing.id, data as ChallengeUpdateRequest, groundTruthFile, metricScriptFile);
    else await createChallenge(data, groundTruthFile!, metricScriptFile);
    setIsFormOpen(false);
    setEditing(null);
  };

  const openDeleteModal = (challengeId: string, challengeTitle: string) => {
    setDeleteModal({ isOpen: true, challengeId, challengeTitle });
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteChallenge(deleteModal.challengeId);
    } finally {
      setDeleteLoading(false);
      setDeleteModal({ isOpen: false, challengeId: '', challengeTitle: '' });
    }
  };

  const totalPages = meta ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  return (
    <>
      <div className="card p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary">All Competitions</h2>
            <p className="text-[12px] text-content-tertiary mt-0.5">{meta?.total ?? challenges.length} tổng cộng</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Issue #2: Bộ lọc theo Status */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 text-[12px] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary-500 transition-shadow"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
            <button
              onClick={() => { setEditing(null); setIsFormOpen(true); }}
              className="btn-primary text-[13px] py-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Competition
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 text-sm">{error}</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] text-content-tertiary uppercase tracking-wider bg-surface-50 dark:bg-gray-900/40">
                  <th className="px-5 py-2.5 text-left font-medium">Title</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Metric</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">Period</th>
                  <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                {challenges.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-content-tertiary">
                      {statusFilter ? `Không có bài thi nào có trạng thái "${statusFilter}".` : 'Chưa có bài thi nào.'}
                    </td>
                  </tr>
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
                      <td className="px-5 py-3.5 font-medium text-primary-600 dark:text-primary-400 hidden sm:table-cell">{c.metric_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${c.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-content-tertiary text-[12px]">
                        {new Date(c.start_time).toLocaleDateString('vi-VN')} — {new Date(c.end_time).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5">
                        {/* Issue #3 + #5: ActionDropdown với tách biệt state loading */}
                        <ActionDropdown
                          challenge={c}
                          exportingLeaderboard={exportingLeaderboard}
                          onExportPub={() => downloadLeaderboardCSV(c.id, 'public', c.title)}
                          onExportPriv={() => downloadLeaderboardCSV(c.id, 'private', c.title)}
                          onEdit={() => { setEditing(c); setIsFormOpen(true); }}
                          onDelete={() => openDeleteModal(c.id, c.title)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Issue #2: Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-surface-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[12px] text-content-tertiary">
              Trang <strong className="text-content-secondary dark:text-content-dark-secondary">{page}</strong> / {totalPages}
              &nbsp;·&nbsp;{meta?.total ?? 0} bài thi
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-[12px] font-medium bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 rounded-lg hover:bg-surface-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-[12px] font-medium bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 rounded-lg hover:bg-surface-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Issue #1: ConfirmationModal cho Delete */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Xóa bài thi?"
        message={`Bạn có chắc chắn muốn xóa bài thi "${deleteModal.challengeTitle}"? Toàn bộ dữ liệu liên quan (submissions, leaderboard) sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa bài thi"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, challengeId: '', challengeTitle: '' })}
      />

      {/* Form tạo/sửa bài thi */}
      {isFormOpen && (
        <ChallengeForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditing(null); }}
        />
      )}
    </>
  );
};

export default ChallengeManagePage;
