import React, { useState, useEffect } from 'react';
import type { CreateInviteResponse } from '../../models/api.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  inviteResult: CreateInviteResponse | null;
  onGenerate: () => void;
}

const InviteModal: React.FC<Props> = ({ isOpen, onClose, loading, inviteResult, onGenerate }) => {
  const [copied, setCopied] = useState(false);

  // Auto generate invite when opening if not generated yet
  useEffect(() => {
    if (isOpen && !inviteResult && !loading) {
      onGenerate();
    }
  }, [isOpen, inviteResult, loading, onGenerate]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!inviteResult) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteResult.invite_url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = inviteResult.invite_url;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mời thành viên</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 dark:border-slate-700 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">Đang tạo link mời...</p>
            </div>
          ) : inviteResult ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Gửi link này cho bạn bè để mời họ tham gia đội. Link có hiệu lực trong 24 giờ.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={inviteResult.invite_url}
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                />
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition-all min-w-[100px]"
                >
                  {copied ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Đã copy!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      Copy link
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center">Chưa có link mời nào được tạo.</p>
              <button 
                onClick={onGenerate}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Tạo link ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
