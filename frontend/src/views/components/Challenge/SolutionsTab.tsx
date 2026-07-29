import React, { useState, useEffect } from "react";
import { challengeService } from "../../../services/challengeService";
import type { Solution } from "../../../models/api.types";
import { useToastStore } from "../../../store/toastStore";

interface SolutionsTabProps {
  challengeId: string;
}

export const SolutionsTab: React.FC<SolutionsTabProps> = ({ challengeId }) => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const res = await challengeService.listSolutions(challengeId);
      setSolutions(res.items);
    } catch (err) {
      console.error("Failed to load solutions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !file) {
      useToastStore.getState().showToast("Vui lòng điền đầy đủ thông tin và chọn file notebook.", "warning");
      return;
    }
    try {
      setUploading(true);
      await challengeService.publishSolution(challengeId, title, content, file);
      useToastStore.getState().showToast("Đăng giải pháp thành công!", "success");
      setShowModal(false);
      setTitle("");
      setContent("");
      setFile(null);
      fetchSolutions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message: string };
      const detail = error.response?.data?.detail || error.message || "Lỗi không xác định";
      useToastStore.getState().showToast("Có lỗi xảy ra: " + detail, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleUpvote = async (solutionId: string) => {
    if (upvotingId === solutionId) return;
    try {
      setUpvotingId(solutionId);
      const updated = await challengeService.upvoteSolution(challengeId, solutionId);
      setSolutions((prev) => prev.map((s) => (s.id === solutionId ? { ...s, upvotes: updated.upvotes } : s)));
      useToastStore.getState().showToast("Đã upvote thành công!", "success", 2500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        useToastStore.getState().showToast("Bạn đã upvote bài này rồi!", "warning");
      } else if (status === 401) {
        useToastStore.getState().showToast("Vui lòng đăng nhập để upvote!", "info");
      } else {
        console.error("Upvote failed", err);
        useToastStore.getState().showToast("Không thể upvote. Vui lòng thử lại!", "error");
      }
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Giải pháp cộng đồng</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Chia sẻ và học hỏi từ các notebook của cộng đồng</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold text-sm transition-all hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm hover:shadow-md"
        >
          Đăng giải pháp
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="font-medium">Đang tải...</p>
        </div>
      ) : solutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Chưa có giải pháp nào</h4>
          <p className="text-sm text-slate-500 max-w-sm">Hãy là người đầu tiên chia sẻ notebook giải pháp của bạn!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{s.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Đăng bởi <span className="font-semibold text-primary-600 dark:text-primary-400">{s.author_name || s.user_id}</span>
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                {new Date(s.created_at).toLocaleString('vi-VN')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{s.content}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleUpvote(s.id)}
                  disabled={upvotingId === s.id}
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full transition-all ${
                    upvotingId === s.id
                      ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  {s.upvotes} Upvotes
                </button>
                <a
                  href={s.notebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Tải Notebook
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 w-full max-w-lg shadow-2xl animate-scale-in">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Chia sẻ giải pháp</h2>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nhập tiêu đề giải pháp..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả chi tiết</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  rows={4}
                  placeholder="Mô tả phương pháp, kết quả của bạn..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">File Notebook (.ipynb)</label>
                <div className="border border-surface-200 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-surface-50 dark:bg-slate-800/60">
                  <input
                    type="file"
                    accept=".ipynb"
                    className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400 cursor-pointer"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
                >
                  {uploading ? "Đang tải lên..." : "Đăng bài"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
