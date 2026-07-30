/* eslint-disable react-refresh/only-export-components */
/**
 * Toast — Hệ thống thông báo popup đẹp, dùng chung với dark theme của web.
 * Thay thế hoàn toàn browser alert().
 *
 * Cách dùng:
 *   import { showToast } from "../../store/toastStore";
 *   showToast("Thành công!", "success");
 *   <ToastContainer />
 */
import React from "react";
import { useToastStore } from "../../store/toastStore";
import type { ToastType, ToastItem } from "../../store/toastStore";

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconCls: string; textColor: string }> = {
  success: { bg: "bg-[#0f2b1a]", border: "border-green-500/50", icon: "✓", iconCls: "text-green-400 bg-green-500/20", textColor: "text-green-100" },
  error:   { bg: "bg-[#2b0f0f]", border: "border-red-500/50",   icon: "✕", iconCls: "text-red-400 bg-red-500/20",     textColor: "text-red-100"   },
  warning: { bg: "bg-[#2b1e0f]", border: "border-yellow-500/50",icon: "⚠", iconCls: "text-yellow-400 bg-yellow-500/20",textColor: "text-yellow-100"},
  info:    { bg: "bg-[#0f1a2b]", border: "border-blue-500/50",  icon: "ℹ", iconCls: "text-blue-400 bg-blue-500/20",   textColor: "text-blue-100"  },
};

interface SingleToastProps { item: ToastItem; onClose: (id: number) => void; }

const SingleToast: React.FC<SingleToastProps> = ({ item, onClose }) => {
  const s = TOAST_STYLES[item.type];
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 min-w-[300px] max-w-sm w-full ${s.bg} border ${s.border}
        rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${item.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
    >
      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${s.iconCls}`}>
        {s.icon}
      </span>
      <p className={`flex-1 text-sm font-medium leading-snug pt-0.5 ${s.textColor}`}>{item.message}</p>
      <button onClick={() => onClose(item.id)} className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none" aria-label="Đóng thông báo">×</button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const closeToast = useToastStore((state) => state.closeToast);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(item => (
        <div key={item.id} className="pointer-events-auto">
          <SingleToast item={item} onClose={closeToast} />
        </div>
      ))}
    </div>
  );
};
