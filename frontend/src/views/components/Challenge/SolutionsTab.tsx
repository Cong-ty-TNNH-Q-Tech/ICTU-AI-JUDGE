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

  // Global toast is mounted in App.tsx

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
      useToastStore.getState().showToast("Vui l├▓ng ─æiß╗ün ─æß╗º th├┤ng tin v├á chß╗ìn file notebook.", "warning");
      return;
    }
    try {
      setUploading(true);
      await challengeService.publishSolution(challengeId, title, content, file);
      useToastStore.getState().showToast("─É─âng giß║úi ph├íp th├ánh c├┤ng! ≡ƒÄë", "success");
      setShowModal(false);
      setTitle("");
      setContent("");
      setFile(null);
      fetchSolutions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message: string };
      const detail = error.response?.data?.detail || error.message || "Lß╗ùi kh├┤ng x├íc ─æß╗ïnh";
      useToastStore.getState().showToast("C├│ lß╗ùi xß║úy ra: " + detail, "error");
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
      useToastStore.getState().showToast("─É├ú upvote th├ánh c├┤ng! ≡ƒæì", "success", 2500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        useToastStore.getState().showToast("Bß║ín ─æ├ú upvote b├ái n├áy rß╗ôi!", "warning");
      } else if (status === 401) {
        useToastStore.getState().showToast("Vui l├▓ng ─æ─âng nhß║¡p ─æß╗â upvote!", "info");
      } else {
        console.error("Upvote failed", err);
        useToastStore.getState().showToast("Kh├┤ng thß╗â upvote. Vui l├▓ng thß╗¡ lß║íi!", "error");
      }
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div className="mt-6">
      {/* Toast is mounted in App.tsx */}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Giß║úi ph├íp cß╗Öng ─æß╗ông (Kernels)</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + ─É─âng giß║úi ph├íp
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">─Éang tß║úi...</div>
      ) : solutions.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-[#1a2035] rounded-xl border border-dashed border-gray-700">
          Ch╞░a c├│ giß║úi ph├íp n├áo ─æ╞░ß╗úc chia sß║╗. H├úy l├á ng╞░ß╗¥i ─æß║ºu ti├¬n!
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((s) => (
            <div key={s.id} className="bg-[#1a2035] border border-gray-700 p-5 rounded-xl shadow-sm hover:border-gray-500 transition">
              <h4 className="text-lg font-semibold text-white mb-1">{s.title}</h4>
              <p className="text-sm text-gray-400 mb-3">
                ─É─âng bß╗ƒi <span className="font-medium text-blue-400">{s.author_name || s.user_id}</span> ┬╖ {new Date(s.created_at).toLocaleString()}
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
                  <span>≡ƒæì</span>
                  <span>{s.upvotes} Upvotes</span>
                </button>
                <a href={s.notebook_url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition">
                  ≡ƒôÑ Tß║úi Notebook
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2035] border border-gray-700 rounded-xl p-6 w-full max-w-lg text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-5 text-white">Chia sß║╗ Giß║úi ph├íp</h2>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium text-sm">Ti├¬u ─æß╗ü</label>
                <input
                  type="text"
                  className="w-full bg-[#0f1729] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nhß║¡p ti├¬u ─æß╗ü giß║úi ph├íp..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium text-sm">M├┤ tß║ú chi tiß║┐t</label>
                <textarea
                  className="w-full bg-[#0f1729] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  rows={4}
                  placeholder="M├┤ tß║ú ph╞░╞íng ph├íp, kß║┐t quß║ú cß╗ºa bß║ín..."
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
                  Hß╗ºy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                >
                  {uploading ? "─Éang tß║úi l├¬n..." : "─É─âng b├ái"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
