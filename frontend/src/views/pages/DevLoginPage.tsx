/**
 * DevLoginPage — Trang đăng nhập nhanh cho dev/testing.
 * Không cần Google OAuth. Chỉ dùng trong môi trường development.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../core/apiClient';
import { useAuthStore } from '../../store';

const KNOWN_USERS = [
  { label: 'Nguyen Tran Anh Hoang (Student)', id: '09c9aec1-4dba-49a7-8316-4b982852e7c0' },
];

const DevLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customId, setCustomId] = useState('');

  const doLogin = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/auth/dev-login', { user_id: userId });
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        avatar_url: null,
        is_active: true,
      });
      navigate('/challenges');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError('Login thất bại: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🛠️</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dev Login</h1>
            <p className="text-sm text-gray-500">Đăng nhập nhanh — chỉ dùng trong môi trường dev</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {KNOWN_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => doLogin(u.id)}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              <p className="font-medium text-gray-900 text-sm">{u.label}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{u.id}</p>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-500 mb-2 font-medium">Hoặc nhập User ID thủ công:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="UUID..."
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => doLogin(customId)}
              disabled={loading || !customId.trim()}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors"
            >
              Login
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Đang đăng nhập...
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            ⚠️ Trang này không xuất hiện trên môi trường production
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevLoginPage;
