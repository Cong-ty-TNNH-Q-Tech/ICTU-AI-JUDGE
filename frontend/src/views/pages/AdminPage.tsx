import React from 'react';
import { useAuthStore } from '../../store';

const AdminPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
          {user?.role || 'ADMIN'}
        </span>
      </div>
      
      <div className="bg-surface-dark border border-slate-800 rounded-xl p-8 text-center">
        <div className="py-12">
          <h3 className="text-xl text-white font-medium mb-2">Khu vực quản trị</h3>
          <p className="text-slate-400">Các chức năng quản lý đang được phát triển.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
