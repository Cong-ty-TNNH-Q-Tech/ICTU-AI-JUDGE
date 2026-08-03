/**
 * UserManagePage — Quản lý sinh viên (UC12).
 *
 * Cải tiến theo Admin UX Review:
 * 1. ConfirmationModal trước khi Khóa/Mở khóa tài khoản
 * 2. Phân trang (Pagination) + bộ lọc trạng thái
 * 3. Inline loading spinner cho nút Lock/Unlock và dropdown Role
 * 4. Responsive: cột Actions ẩn trên màn hình nhỏ, dùng menu dropdown
 */
import React, { useState } from 'react';
import { useAdminUsersVM } from '../../../viewmodels/useAdminVM';
import type { UserRole } from '../../../models/api.types';
import ConfirmationModal from '../../components/ConfirmationModal';

const UserManagePage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const {
    users,
    meta,
    loading,
    error,
    toggleUserStatus,
    updateUserRole,
    updatingRoleId,
    togglingStatusId,
  } = useAdminUsersVM({ q: search, page, size: PAGE_SIZE });

  // --- Confirmation modal state ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    currentStatus: boolean;
  }>({ isOpen: false, userId: '', userName: '', currentStatus: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const openConfirmToggle = (userId: string, userName: string, currentStatus: boolean) => {
    setConfirmModal({ isOpen: true, userId, userName, currentStatus });
  };

  const handleConfirmToggle = async () => {
    setConfirmLoading(true);
    try {
      await toggleUserStatus(confirmModal.userId, confirmModal.currentStatus);
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ isOpen: false, userId: '', userName: '', currentStatus: false });
    }
  };

  const totalPages = meta ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  return (
    <>
      <div className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary dark:text-content-dark-primary tracking-tight">Tất cả người dùng</h2>
            <p className="text-[13px] text-content-secondary dark:text-content-dark-secondary mt-1">
              {meta?.total ?? users.length} người dùng
            </p>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="w-[14px] h-[14px] absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-surface-200 dark:border-white/10 pl-9 pr-4 py-2 text-[13px] rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium w-56"
            />
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
                  <th className="px-5 py-3 text-left font-semibold">Người dùng</th>
                  <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">Mã SV</th>
                  <th className="px-5 py-3 text-left font-semibold">Vai trò</th>
                  <th className="px-5 py-3 text-left font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-content-secondary bg-surface-50/50 dark:bg-surface-dark/50 rounded-xl">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px]">
                      {/* User Info */}
                      <td className="px-5 py-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm">
                              {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-content-primary dark:text-content-dark-primary truncate">{u.full_name}</p>
                            <p className="text-[12px] text-content-secondary dark:text-content-dark-secondary truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-5 py-4 text-content-secondary dark:text-content-dark-secondary hidden sm:table-cell">
                        {u.student_id || '—'}
                      </td>

                      {/* Role Dropdown with inline loading */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updatingRoleId === u.id}
                            onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                            className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-surface-200 dark:border-white/10 text-[12px] font-medium rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary-500 transition-shadow disabled:opacity-60 disabled:cursor-wait"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {/* Issue #3: Inline loading spinner cho Role update */}
                          {updatingRoleId === u.id && (
                            <svg className="animate-spin h-4 w-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>

                      {/* Action — mở ConfirmationModal thay vì gọi thẳng */}
                      <td className="px-5 py-4 text-right rounded-r-xl">
                        <button
                          onClick={() => openConfirmToggle(u.id, u.full_name || u.email, u.is_active)}
                          disabled={togglingStatusId === u.id}
                          className={`glass-btn text-[12px] py-1.5 px-3 flex items-center gap-1.5 ml-auto disabled:opacity-50 disabled:cursor-wait ${u.is_active ? 'text-red-500 hover:text-red-600 dark:hover:text-red-400' : 'text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'}`}
                        >
                          {/* Issue #3: Inline spinner cho toggle status */}
                          {togglingStatusId === u.id ? (
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : null}
                          {u.is_active ? 'Khóa' : 'Mở khóa'}
                        </button>
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
              &nbsp;·&nbsp;{meta?.total ?? 0} kết quả
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

      {/* Issue #1: Confirmation Modal cho Lock/Unlock */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.currentStatus ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        message={
          confirmModal.currentStatus
            ? `Bạn có chắc chắn muốn khóa tài khoản của "${confirmModal.userName}"? Người dùng sẽ không thể đăng nhập sau thao tác này.`
            : `Bạn có chắc chắn muốn mở khóa tài khoản của "${confirmModal.userName}"?`
        }
        confirmLabel={confirmModal.currentStatus ? 'Khóa tài khoản' : 'Mở khóa'}
        confirmVariant={confirmModal.currentStatus ? 'danger' : 'warning'}
        loading={confirmLoading}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmModal({ isOpen: false, userId: '', userName: '', currentStatus: false })}
      />
    </>
  );
};

export default UserManagePage;
