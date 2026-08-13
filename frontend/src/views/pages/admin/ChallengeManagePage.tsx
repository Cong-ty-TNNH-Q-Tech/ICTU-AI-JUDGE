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
import ConfirmationModal from '../../components/ConfirmationModal';
import WhitelistManageModal from '../../components/admin/WhitelistManageModal';

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
  /** Chỉ truyền vào nếu challenge.type === 'COMPETITION' */
  onManageWhitelist?: () => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  challenge,
  exportingLeaderboard,
  onExportPub,
  onExportPriv,
  onEdit,
  onDelete,
  onManageWhitelist,
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
      <div className="hidden md:flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onExportPub}
          disabled={isExportingPub}
          className="glass-btn text-[12px] py-1.5 px-3 text-primary-600 dark:text-primary-400 disabled:opacity-50 flex items-center gap-1.5"
        >
          {isExportingPub ? (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : null}
          Xuất CSV (Pub)
        </button>
        <button
          onClick={onExportPriv}
          disabled={isExportingPriv}
          className="glass-btn text-[12px] py-1.5 px-3 text-purple-600 dark:text-purple-400 disabled:opacity-50 flex items-center gap-1.5"
        >
          {isExportingPriv ? (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : null}
          Xuất CSV (Priv)
        </button>
        <button onClick={onEdit} className="glass-btn text-[12px] py-1.5 px-3">Sửa</button>
        <button onClick={onDelete} className="glass-btn text-[12px] py-1.5 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Xóa</button>
        {/* Issue #91: Nút Whitelist — chỉ hiện với COMPETITION */}
        {onManageWhitelist && (
          <button
            onClick={onManageWhitelist}
            className="glass-btn text-[12px] py-1.5 px-3 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Danh sách trắng
          </button>
        )}
      </div>

      {/* Mobile: Menu 3 chấm */}
      <div className="md:hidden relative" ref={ref}>
        <button
          onClick={() => setIsOpen(o => !o)}
          className="btn-ghost p-1.5 text-content-secondary"
          aria-label="Mở menu hành động"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 z-50 bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-700 rounded-xl shadow-elevated min-w-[180px] py-1 animate-fade-in">
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
              Xuất CSV Leaderboard (Public)
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
              Xuất CSV Leaderboard (Private)
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
            {/* Issue #91: Nút Whitelist trong Mobile menu — chỉ hiện với COMPETITION */}
            {onManageWhitelist && (
              <>
                <div className="h-px bg-surface-100 dark:bg-gray-800 my-1" />
                <button
                  onClick={() => { onManageWhitelist(); setIsOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Quản lý Danh sách trắng
                </button>
              </>
            )}
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

  // --- Whitelist modal state (Issue #91) ---
  const [whitelistChallenge, setWhitelistChallenge] = useState<Challenge | null>(null);

  // --- Confirmation modal state for Delete ---
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    challengeId: string;
    challengeTitle: string;
  }>({ isOpen: false, challengeId: '', challengeTitle: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // publicTestSplitRatio theo main — mặc định 30%
  const handleSubmit = async (data: ChallengeCreateRequest, groundTruthFile?: File, metricScriptFile?: File, publicTestSplitRatio: number = 30) => {
    if (editing) await updateChallenge(editing.id, data as ChallengeUpdateRequest, groundTruthFile, metricScriptFile, publicTestSplitRatio);
    else await createChallenge(data, groundTruthFile!, metricScriptFile, publicTestSplitRatio);
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
      <div className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary dark:text-content-dark-primary tracking-tight">Tất cả thử thách</h2>
            <p className="text-[13px] text-content-secondary dark:text-content-dark-secondary mt-1">{meta?.total ?? challenges.length} thử thách</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Issue #2: Bộ lọc theo Status */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-surface-200 dark:border-white/10 text-[13px] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã phát hành</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
            <button
              onClick={() => { setEditing(null); setIsFormOpen(true); }}
              className="btn-primary rounded-xl px-4 py-2.5 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 hover:shadow-primary-500/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tạo thử thách mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 text-sm bg-red-50/50 dark:bg-red-900/10 rounded-xl">{error}</div>
          ) : (
            <table className="w-full text-[13.5px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] text-content-secondary dark:text-content-dark-secondary uppercase tracking-widest bg-transparent">
                  <th className="px-5 py-3 text-left font-semibold">Tiêu đề</th>
                  <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">Thước đo</th>
                  <th className="px-5 py-3 text-left font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Thời gian</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {challenges.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-content-secondary bg-surface-50/50 dark:bg-surface-dark/50 rounded-xl">
                      {statusFilter ? `Không tìm thấy thử thách nào cho trạng thái "${statusFilter}".` : 'Chưa có thử thách nào.'}
                    </td>
                  </tr>
                ) : (
                  challenges.map(c => (
                    <tr key={c.id} className="bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-[1px]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-content-primary dark:text-content-dark-primary mb-0.5">{c.title}</p>
                        <div className="flex gap-1.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.is_public ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {c.is_public ? 'Công khai' : 'Mật khẩu'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-primary-600 dark:text-primary-400 hidden sm:table-cell">{c.metric_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${c.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-content-tertiary text-[12px]">
                        {new Date(c.start_time).toLocaleDateString('vi-VN')} — {c.end_time ? new Date(c.end_time).toLocaleDateString('vi-VN') : 'Không giới hạn'}
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
                          onManageWhitelist={c.type === 'COMPETITION' ? () => setWhitelistChallenge(c) : undefined}
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

      {/* Issue #91: Whitelist Management Modal — chỉ với COMPETITION */}
      {whitelistChallenge && (
        <WhitelistManageModal
          isOpen={true}
          challenge={whitelistChallenge}
          onClose={() => setWhitelistChallenge(null)}
        />
      )}
    </>
  );
};

export default ChallengeManagePage;
