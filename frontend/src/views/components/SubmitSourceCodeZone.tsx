import React, { useState, useRef, useEffect } from 'react';
import type { Submission } from '../../models/api.types';

interface SubmitSourceCodeZoneProps {
  maxFileSizeMb: number;
  submitting: boolean;
  uploadProgress: number;  // 0-100
  submitError: string | null;
  submitSuccess: string | null;
  submissions: Submission[];
  onSubmit: (submissionId: string, file: File, maxFileSizeMb: number) => void;
  onClearErrors: () => void;
}

const SubmitSourceCodeZone: React.FC<SubmitSourceCodeZoneProps> = ({
  maxFileSizeMb,
  submitting,
  uploadProgress,
  submitError,
  submitSuccess,
  submissions,
  onSubmit,
  onClearErrors,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Find the submission selected for private leaderboard, or fallback to the best public one, or just the first successful one
  const successfulSubmissions = submissions.filter(s => s.status === 'SUCCESS');
  
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  
  useEffect(() => {
    if (successfulSubmissions.length > 0 && !selectedSubmissionId) {
      const privateSelected = successfulSubmissions.find(s => s.is_selected_for_private);
      if (privateSelected) {
        setSelectedSubmissionId(privateSelected.id);
      } else {
        setSelectedSubmissionId(successfulSubmissions[0].id);
      }
    }
  }, [successfulSubmissions, selectedSubmissionId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setLocalError(null);
    onClearErrors();
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.zip') && !ext.endsWith('.rar')) {
      setLocalError('Chỉ chấp nhận file định dạng .zip hoặc .rar');
      setSelectedFile(null);
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setLocalError(`Kích thước file vượt quá giới hạn ${maxFileSizeMb}MB`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !selectedSubmissionId) return;
    onSubmit(selectedSubmissionId, selectedFile, maxFileSizeMb);
  };

  // Clear selected file if upload succeeds
  useEffect(() => {
    if (submitSuccess) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [submitSuccess]);

  const errorToShow = localError || submitError;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Alert for Source Code Anti-Cheat */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex gap-3">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div className="text-sm">
          <p className="font-bold mb-1">Quy định nộp Source Code (Anti-Cheat)</p>
          <ul className="list-disc pl-4 space-y-1 opacity-90">
            <li>Bạn phải nộp file nén chứa source code dự đoán cuối cùng (bao gồm script tiền xử lý, huấn luyện và suy luận).</li>
            <li>Bắt buộc phải có file <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">requirements.txt</code> hoặc <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">environment.yml</code>.</li>
            <li>Ban tổ chức sẽ dùng mã nguồn này để tái hiện kết quả trên Private Leaderboard.</li>
            <li>Không nộp hoặc kết quả không thể tái hiện sẽ dẫn đến việc <strong>hủy bỏ kết quả thi</strong>.</li>
          </ul>
        </div>
      </div>

      {successfulSubmissions.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.25h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Bạn chưa có bài nộp nào thành công để đính kèm source code.</p>
        </div>
      ) : (
        <>
          {/* Success message */}
          {submitSuccess && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-sm font-medium">{submitSuccess}</span>
            </div>
          )}

          {/* Error message */}
          {errorToShow && (
            <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-sm font-medium">{errorToShow}</span>
            </div>
          )}

          {/* Upload card */}
          <div className="bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Nộp Source Code dự đoán</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Liên kết với lượt nộp bài:
              </label>
              <select
                value={selectedSubmissionId}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {successfulSubmissions.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    Nộp lúc {new Date(sub.created_at).toLocaleString('vi-VN')} - Điểm Public: {sub.public_score?.toFixed(4) || 'N/A'} {sub.is_selected_for_private ? '(Đang chọn tính điểm Private)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 relative overflow-hidden cursor-pointer ${
                dragActive
                  ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-500/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
              }`}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              {/* Progress bar */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
              )}

              {!selectedFile ? (
                <>
                  <div className="w-14 h-14 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">Kéo thả file .zip hoặc .rar vào đây</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">hoặc click để chọn file nén source code</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".zip,.rar"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <p className="text-slate-400 text-xs">Kích thước tối đa: {maxFileSizeMb}MB</p>
                </>
              ) : (
                <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-slate-900 dark:text-white font-semibold mb-1">{selectedFile.name}</p>
                  <p className="text-slate-500 text-sm mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  {!submitting && (
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 text-sm font-medium transition-colors"
                    >
                      Bỏ chọn file
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="mt-6 flex justify-end items-center gap-4">
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || !selectedSubmissionId || submitting}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />}
                {submitting ? (uploadProgress > 0 ? `Đang nộp... ${uploadProgress}%` : 'Đang xử lý...') : 'Nộp Source Code'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubmitSourceCodeZone;
