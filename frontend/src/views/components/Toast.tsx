/**
 * Toast — Hệ thống thông báo popup đẹp, dùng chung với dark theme của web.
 * Phiên bản mới đọc toast từ useToastStore (Zustand) — single source of truth.
 * ToastContainer được mount toàn cục một lần duy nhất trong App.tsx.
 */
import React from 'react';
import { useToastStore } from '../../store/toastStore';
import type { ToastType } from '../../store/toastStore';

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconCls: string; textColor: string }> = {
  success: { bg: 'bg-[#0f2b1a]', border: 'border-green-500/50',  icon: '✓', iconCls: 'text-green-400 bg-green-500/20',   textColor: 'text-green-100' },
  error:   { bg: 'bg-[#2b0f0f]', border: 'border-red-500/50',    icon: '✕', iconCls: 'text-red-400 bg-red-500/20',       textColor: 'text-red-100'   },
  warning: { bg: 'bg-[#2b1e0f]', border: 'border-yellow-500/50', icon: '⚠', iconCls: 'text-yellow-400 bg-yellow-500/20', textColor: 'text-yellow-100'},
  info:    { bg: 'bg-[#0f1a2b]', border: 'border-blue-500/50',   icon: 'ℹ', iconCls: 'text-blue-400 bg-blue-500/20',     textColor: 'text-blue-100'  },
};

interface SingleToastProps {
  id: string;
  message: string;
  type: ToastType;
}

const SingleToast: React.FC<SingleToastProps> = ({ id, message, type }) => {
  const closeToast = useToastStore((s) => s.closeToast);
  const s = TOAST_STYLES[type];
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 min-w-[300px] max-w-sm w-full ${s.bg} border ${s.border}
        rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm
        animate-[fadeInRight_0.3s_ease-out]`}
    >
      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${s.iconCls}`}>
        {s.icon}
      </span>
      <p className={`flex-1 text-sm font-medium leading-snug pt-0.5 ${s.textColor}`}>{message}</p>
      <button
        onClick={() => closeToast(id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
};

/**
 * ToastContainer — Đặt duy nhất một lần trong App.tsx.
 * Tự động hiển thị toast khi useToastStore.showToast() được gọi từ bất kỳ nơi nào.
 */
export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <SingleToast id={t.id} message={t.message} type={t.type} />
        </div>
      ))}
    </div>
  );
};

/** @deprecated Dùng useToastStore.getState().showToast() thay thế. */
export function useToast() {
  const { showToast, closeToast } = useToastStore.getState();
  return {
    showToast,
    closeToast,
    ToastContainer,
  };
}
