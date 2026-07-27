import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import ChallengeManagePage from './admin/ChallengeManagePage';
import UserManagePage from './admin/UserManagePage';

const AdminPage = () => {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<'challenges' | 'users'>('challenges');

  const tabs = [
    { key: 'challenges' as const, label: 'Competitions' },
    { key: 'users' as const, label: 'Users' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-content-primary dark:text-content-dark-primary tracking-tight">Administration</h1>
          <p className="text-[15px] text-content-secondary dark:text-content-dark-secondary mt-1">Manage competitions and users</p>
        </div>
        <span className="badge badge-primary text-[11px]">{user?.role || 'ADMIN'}</span>
      </div>

      <div className="flex items-center border-b border-surface-200 dark:border-gray-800 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in">{tab === 'challenges' ? <ChallengeManagePage /> : <UserManagePage />}</div>
    </div>
  );
};

export default AdminPage;
