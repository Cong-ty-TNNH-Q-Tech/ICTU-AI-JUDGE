import React, { useState } from 'react';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';

interface OTPVerificationModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onResend?: () => void;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ email, isOpen, onClose, onResend }) => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, loading } = useAuthVM();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      useToastStore.getState().showToast('Mã OTP phải có 6 chữ số', 'error');
      return;
    }
    
    try {
      await verifyOtp({ email, otp });
      useToastStore.getState().showToast('Đăng ký thành công!', 'success');
      onClose();
      navigate('/challenges');
    } catch {
      // Error handled in VM
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-slide-up">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Xác thực OTP</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
            Một mã gồm 6 chữ số đã được gửi đến <span className="font-semibold">{email}</span>. Vui lòng nhập mã để hoàn tất đăng ký.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                Mã xác thực
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full text-center tracking-widest text-2xl px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
            </div>
          </form>
          {onResend && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không nhận được mã?{' '}
                <button
                  type="button"
                  onClick={onResend}
                  disabled={loading}
                  className="font-medium text-primary hover:text-primary-dark focus:outline-none focus:underline transition-colors disabled:opacity-50"
                >
                  Gửi lại mã
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
