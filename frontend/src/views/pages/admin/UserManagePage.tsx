import React, { useState } from 'react';
import { useAdminUsersVM } from '../../../viewmodels/useAdminVM';

const UserManagePage = () => {
  const [search, setSearch] = useState('');
  const { users, loading, error, toggleUserStatus } = useAdminUsersVM({ q: search });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary">All Users</h2>
          <p className="text-[12px] text-content-tertiary mt-0.5">{users.length} accounts</p>
        </div>
        <div className="relative">
          <svg className="w-[14px] h-[14px] absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-8 w-56 py-2 text-[13px]" />
        </div>
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
                <th className="px-5 py-2.5 text-left font-medium">User</th>
                <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Student ID</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-content-tertiary">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-surface-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                          {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-content-primary dark:text-content-dark-primary truncate">{u.full_name}</p>
                          <p className="text-[11px] text-content-tertiary truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-content-secondary dark:text-content-dark-secondary hidden sm:table-cell">{u.student_id || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Locked'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => toggleUserStatus(u.id, u.is_active)}
                        className={`btn-ghost text-[12px] py-1.5 px-3 ${u.is_active ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
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
    </div>
  );
};

export default UserManagePage;
