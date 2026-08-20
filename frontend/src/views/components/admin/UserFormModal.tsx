import React, { useState, useEffect } from 'react';
import type { UserCreateRequest, UserUpdateRequest, UserRole, UserResponse } from '../../../models/api.types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  initialData?: UserResponse | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setStudentId(initialData.student_id || '');
      setEmail(initialData.email);
      setFullName(initialData.full_name);
      setRole(initialData.role);
      setPassword('');
    } else {
      setStudentId('');
      setEmail('');
      setFullName('');
      setRole('STUDENT');
      setPassword('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Partial<UserCreateRequest & UserUpdateRequest> = {
        student_id: studentId,
        email,
        full_name: fullName,
        role,
      };
      if (password) payload.password = password;
      await onSubmit(payload as UserCreateRequest | UserUpdateRequest);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Sửa Sinh Viên' : 'Thêm Sinh Viên'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mã Sinh Viên</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring focus:ring-blue-500 outline-none"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Họ Tên</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring focus:ring-blue-500 outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Quyền</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring focus:ring-blue-500 outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="STUDENT">Sinh viên</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu {initialData && '(Bỏ trống nếu không đổi)'}</label>
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={initialData ? "Giữ nguyên" : "Mặc định là Mã Sinh Viên"}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
