import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OTPVerificationModal from '../components/OTPVerificationModal';
import { useToastStore } from '../../store/toastStore';
import { useAuthVM } from '../../viewmodels/useAuthVM';

const RegisterPage = () => {
  const { loading, register } = useAuthVM();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);

  const handleResendOTP = async () => {
    try {
      await register({
        email,
        password,
        full_name: fullName,
        student_id: studentId,
      });
      useToastStore.getState().showToast("Đã gửi lại mã OTP.", "success");
    } catch {
      // Lỗi đã được xử lý hiển thị toast trong VM
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      useToastStore.getState().showToast("Mật khẩu xác nhận không khớp.", "error");
      return;
    }
    try {
      await register({
        email,
        password,
        full_name: fullName,
        student_id: studentId,
      });
      setIsOTPModalOpen(true);
    } catch {
      // Lỗi đã được xử lý hiển thị toast trong VM
    }
  };

  return (
    <div className="px-8 pb-8 pt-2 animate-fade-in space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">Tạo tài khoản mới</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã sinh viên (Tùy chọn)</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Ví dụ: DTC205123456"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (@ictu.edu.vn)</label>
          <input
            type="email"
            required
            pattern=".*@ictu\.edu\.vn$"
            title="Vui lòng sử dụng email đuôi @ictu.edu.vn"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sv.nguyenvana@ictu.edu.vn"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 8 ký tự"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xác nhận mật khẩu</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors mt-6"
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Đã có tài khoản? </span>
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Đăng nhập ngay
        </Link>
      </div>

      <OTPVerificationModal 
        email={email} 
        isOpen={isOTPModalOpen} 
        onClose={() => setIsOTPModalOpen(false)} 
        onResend={handleResendOTP}
      />
    </div>
  );
};

export default RegisterPage;
