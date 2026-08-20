import React, { useState } from 'react';
import type { UserImportResult } from '../../../models/api.types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<UserImportResult | undefined>;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UserImportResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const res = await onSubmit(file);
      if (res) {
        setResult(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Nhập từ CSV</h2>
        
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center bg-slate-900">
              <span className="mx-auto text-4xl text-slate-400 mb-2 block">☁</span>
              <p className="text-slate-300 mb-2">
                {file ? file.name : "Kéo thả hoặc chọn file CSV"}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded inline-block transition-colors"
              >
                Chọn file
              </label>
            </div>
            <div className="text-sm text-slate-400">
              <p>File CSV cần có các cột: <strong>student_id, email, full_name</strong>.</p>
              <p>Mật khẩu mặc định sẽ là <strong>student_id</strong>.</p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Import'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-4xl text-green-500">✔</span>
              <div>
                <h3 className="text-lg font-semibold text-green-400">Hoàn tất Import</h3>
                <p className="text-sm text-slate-300">Đã xử lý {result.total} dòng.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900 p-4 rounded border border-slate-700 text-center">
                <p className="text-2xl font-bold text-green-400">{result.success}</p>
                <p className="text-sm text-slate-400">Thành công</p>
              </div>
              <div className="bg-slate-900 p-4 rounded border border-slate-700 text-center">
                <p className="text-2xl font-bold text-red-400">{result.failed}</p>
                <p className="text-sm text-slate-400">Thất bại</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-slate-900 p-4 rounded border border-slate-700 max-h-48 overflow-y-auto">
                <h4 className="flex items-center text-red-400 font-semibold mb-2">
                  <span className="mr-2">⚠</span>
                  Chi tiết lỗi
                </h4>
                <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={resetAndClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCSVModal;
