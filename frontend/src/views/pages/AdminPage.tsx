import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import ChallengeManagePage from './admin/ChallengeManagePage';
import UserManagePage from './admin/UserManagePage';
import ContestManagePage from './admin/ContestManagePage';

const AdminPage = () => {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<'challenges' | 'contests' | 'users'>('challenges');

  const tabs = [
    { 
      key: 'challenges' as const, 
      label: 'Thử thách',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    { 
      key: 'contests' as const, 
      label: 'Cuộc thi (Contests)',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      )
    },
    { 
      key: 'users' as const, 
      label: 'Người dùng',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
  ];

  const renderTab = () => {
    if (tab === 'challenges') return <ChallengeManagePage />;
    if (tab === 'contests') return <ContestManagePage />;
    return <UserManagePage />;
  };

  return (
    <div className="animate-fade-in flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Header inside sidebar */}
        <div className="glass-panel p-5 border-0 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight mb-1">
              Bảng Quản Trị
            </h1>
            <p className="text-[12px] text-content-secondary dark:text-content-dark-secondary">
              Quản lý hệ thống nền tảng
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="glass-panel p-3 border-0 shadow-sm flex flex-col gap-1.5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 ${tab === t.key ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 translate-x-1' : 'text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-white/5 hover:text-content-primary dark:hover:text-content-dark-primary'}`}>
              <div className={tab === t.key ? 'text-white' : 'text-content-tertiary'}>
                {t.icon}
              </div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full animate-fade-in-up">
        {renderTab()}
      </div>
    </div>
  );
};

export default AdminPage;
