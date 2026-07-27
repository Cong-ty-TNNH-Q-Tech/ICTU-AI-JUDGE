import React, { useState, useEffect } from "react";
import { challengeService } from "../../../services/challengeService";
import type { Solution } from "../../../models/api.types";
import { useToast } from "../Toast";

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

  const { showToast, ToastContainer } = useToast();

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
      showToast("Vui lòng điền đủ thông tin và chọn file notebook.", "warning");
      return;
    }
    try {
      setUploading(true);
      await challengeService.publishSolution(challengeId, title, content, file);
      showToast("Đăng giải pháp thành công! 🎉", "success");
      setShowModal(false);
      setTitle("");
      setContent("");
      setFile(null);
      fetchSolutions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message: string };
      const detail = error.response?.data?.detail || error.message || "Lỗi không xác định";
      showToast("Có lỗi xảy ra: " + detail, "error");
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
      showToast("Đã upvote thành công! 👍", "success", 2500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        showToast("Bạn đã upvote bài này rồi!", "warning");
      } else if (status === 401) {
        showToast("Vui lòng đăng nhập để upvote!", "info");
      } else {
        console.error("Upvote failed", err);
        showToast("Không thể upvote. Vui lòng thử lại!", "error");
      }
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div className="mt-6">
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Giải pháp cộng đồng (Kernels)</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Đăng giải pháp
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Đang tải...</div>
      ) : solutions.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-[#1a2035] rounded-xl border border-dashed border-gray-700">
          Chưa có giải pháp nào được chia sẻ. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((s) => (
            <div key={s.id} className="bg-[#1a2035] border border-gray-700 p-5 rounded-xl shadow-sm hover:border-gray-500 transition">
              <h4 className="text-lg font-semibold text-white mb-1">{s.title}</h4>
              <p className="text-sm text-gray-400 mb-3">
                Đăng bởi <span className="font-medium text-blue-400">{s.author_name || s.user_id}</span> · {new Date(s.created_at).toLocaleString()}
              </p>
              <p className="text-gray-300 mb-4">{s.content}</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleUpvote(s.id)}
                  disabled={upvotingId === s.id}
                  className={`flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-full transition ${
                    upvotingId === s.id
                      ? "opacity-50 cursor-not-allowed bg-gray-700 text-gray-400"
                      : "bg-green-900/40 text-green-400 hover:bg-green-800/60 cursor-pointer border border-green-700/50"
                  }`}
                >
                  <span>👍</span>
                  <span>{s.upvotes} Upvotes</span>
                </button>
                <a href={s.notebook_url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition">
                  📥 Tải Notebook
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2035] border border-gray-700 rounded-xl p-6 w-full max-w-lg text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-5 text-white">Chia sẻ Giải pháp</h2>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium text-sm">Tiêu đề</label>
                <input
                  type="text"
                  className="w-full bg-[#0f1729] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nhập tiêu đề giải pháp..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium text-sm">Mô tả chi tiết</label>
                <textarea
                  className="w-full bg-[#0f1729] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  rows={4}
                  placeholder="Mô tả phương pháp, kết quả của bạn..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-gray-300 mb-1 font-medium text-sm">File Notebook (.ipynb)</label>
                <div className="bg-[#0f1729] border border-gray-600 rounded-lg px-3 py-2">
                  <input
                    type="file"
                    accept=".ipynb"
                    className="w-full text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
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
