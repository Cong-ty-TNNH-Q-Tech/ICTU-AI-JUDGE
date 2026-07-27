import React, { useState, useRef } from 'react';

interface SubmitFileZoneProps {
  maxFileSizeMb: number;
  rateLimitCountdown: number | null;
  submitting: boolean;
  uploadProgress: number;  // 0-100
  submitError: string | null;
  submitSuccess: string | null;
  onSubmit: (file: File, maxFileSizeMb: number) => void;
  onClearErrors: () => void;
}

const SubmitFileZone: React.FC<SubmitFileZoneProps> = ({
  maxFileSizeMb,
  rateLimitCountdown,
  submitting,
  uploadProgress,
  submitError,
  submitSuccess,
  onSubmit,
  onClearErrors,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setLocalError(null);
    onClearErrors(); // Clear VM errors when selecting new file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setLocalError('Chỉ chấp nhận file định dạng .csv');
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
    if (!selectedFile) return;
    onSubmit(selectedFile, maxFileSizeMb);
  };

  // Clear selected file if upload succeeds
  React.useEffect(() => {
    if (submitSuccess) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [submitSuccess]);

  const errorToShow = localError || submitError;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {submitSuccess && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {submitSuccess}
        </div>
      )}

      {errorToShow && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorToShow}
        </div>
      )}

      <div className="bg-surface-dark border border-slate-800 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white mb-6">Nộp kết quả dự đoán</h3>

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors relative overflow-hidden ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
            }`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDrop={handleDrop}
        >
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          )}

          {!selectedFile ? (
            <>
              <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-slate-300 font-medium mb-1">Kéo thả file .csv vào đây</p>
              <p className="text-slate-500 text-sm mb-4">hoặc</p>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Chọn file
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <p className="text-slate-500 text-xs mt-4">Kích thước tối đa: {maxFileSizeMb}MB</p>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-white font-medium mb-1">{selectedFile.name}</p>
              <p className="text-slate-500 text-sm mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              {!submitting && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Hủy bỏ
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end items-center gap-4">
          {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
            <span className="text-sm text-yellow-400">
              Vui lòng chờ {formatCountdown(rateLimitCountdown)}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || submitting || (rateLimitCountdown !== null && rateLimitCountdown > 0)}
            className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            {submitting ? (uploadProgress > 0 ? `Đang nộp... ${uploadProgress}%` : 'Đang xử lý...') : 'Gửi bài'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFileZone;
