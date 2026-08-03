import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import ChallengeManagePage from './admin/ChallengeManagePage';
import UserManagePage from './admin/UserManagePage';
import ContestManagePage from './admin/ContestManagePage';

const AdminPage = () => {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<'challenges' | 'contests' | 'users'>('challenges');

  const tabs = [
    { key: 'challenges' as const, label: 'Competitions' },
    { key: 'contests' as const, label: 'Contests' },
    { key: 'users' as const, label: 'Users' },
  ];

  const renderTab = () => {
    if (tab === 'challenges') return <ChallengeManagePage />;
    if (tab === 'contests') return <ContestManagePage />;
    return <UserManagePage />;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-content-primary dark:text-content-dark-primary tracking-tight">Administration</h1>
          <p className="text-[15px] text-content-secondary dark:text-content-dark-secondary mt-1">Manage competitions, contests and users</p>
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

      <div key={tab} className="animate-fade-in">{renderTab()}</div>
    </div>
  );
};

export default AdminPage;
