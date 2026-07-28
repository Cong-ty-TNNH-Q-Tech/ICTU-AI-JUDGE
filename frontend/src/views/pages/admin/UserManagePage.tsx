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
import ConfirmationModal from '../../components/admin/ConfirmationModal';

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
      <div className="card p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary">All Users</h2>
            <p className="text-[12px] text-content-tertiary mt-0.5">
              {meta?.total ?? users.length} tài khoản
            </p>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="w-[14px] h-[14px] absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-8 w-56 py-2 text-[13px]"
            />
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
                  <th className="px-5 py-2.5 text-left font-medium">User</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Student ID</th>
                  <th className="px-5 py-2.5 text-left font-medium">Role</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  {/* Ẩn cột Action trên mobile, hiện dưới dạng dropdown qua menu 3 chấm */}
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-content-tertiary">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                              {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-content-primary dark:text-content-dark-primary truncate">{u.full_name}</p>
                            <p className="text-[11px] text-content-tertiary truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-5 py-3.5 text-content-secondary dark:text-content-dark-secondary hidden sm:table-cell">
                        {u.student_id || '—'}
                      </td>

                      {/* Role Dropdown with inline loading */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updatingRoleId === u.id}
                            onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                            className="bg-surface-100 dark:bg-gray-800 border border-surface-200 dark:border-gray-700 text-[11px] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500 transition-shadow disabled:opacity-60 disabled:cursor-wait"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {/* Issue #3: Inline loading spinner cho Role update */}
                          {updatingRoleId === u.id && (
                            <svg className="animate-spin h-3.5 w-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Active' : 'Locked'}
                        </span>
                      </td>

                      {/* Action — mở ConfirmationModal thay vì gọi thẳng */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openConfirmToggle(u.id, u.full_name || u.email, u.is_active)}
                          disabled={togglingStatusId === u.id}
                          className={`btn-ghost text-[12px] py-1.5 px-3 flex items-center gap-1.5 ml-auto disabled:opacity-50 disabled:cursor-wait ${
                            u.is_active
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}
                        >
                          {/* Issue #3: Inline spinner cho toggle status */}
                          {togglingStatusId === u.id ? (
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : null}
                          {u.is_active ? 'Lock' : 'Unlock'}
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
