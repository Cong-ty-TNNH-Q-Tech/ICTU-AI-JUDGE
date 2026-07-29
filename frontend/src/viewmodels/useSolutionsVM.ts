/**
 * useSolutionsVM — ViewModel cho Solutions Tab (MVVM Pattern).
 * Tách toàn bộ logic gọi API, quản lý state ra khỏi UI Component.
 * Component SolutionsTab chỉ nhận dữ liệu từ hook này để render.
 */
import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import { useToastStore } from '../store/toastStore';
import type { Solution } from '../models/api.types';

export function useSolutionsVM(challengeId: string) {
  // Data state
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(false);

  // Publish modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upvote state
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  // ── Fetch solutions ──────────────────────────────────
  const fetchSolutions = useCallback(async () => {
    if (!challengeId) return;
    try {
      setLoading(true);
      const res = await challengeService.listSolutions(challengeId);
      setSolutions(res.items);
    } catch {
      useToastStore.getState().showToast('Không thể tải giải pháp.', 'error');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  // ── Publish solution ─────────────────────────────────
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const handlePublish = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !content || !file) {
        useToastStore.getState().showToast(
          'Vui lòng điền đầy đủ thông tin và chọn file notebook.',
          'warning',
        );
        return;
      }
      try {
        setUploading(true);
        await challengeService.publishSolution(challengeId, title, content, file);
        useToastStore.getState().showToast('Đăng giải pháp thành công!', 'success');
        setShowModal(false);
        setTitle('');
        setContent('');
        setFile(null);
        fetchSolutions();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message: string };
        const detail = error.response?.data?.detail || error.message || 'Lỗi không xác định';
        useToastStore.getState().showToast('Có lỗi xảy ra: ' + detail, 'error');
      } finally {
        setUploading(false);
      }
    },
    [challengeId, title, content, file, fetchSolutions],
  );

  // ── Upvote solution ──────────────────────────────────
  const handleUpvote = useCallback(
    async (solutionId: string) => {
      if (upvotingId === solutionId) return;
      try {
        setUpvotingId(solutionId);
        const updated = await challengeService.upvoteSolution(challengeId, solutionId);
        setSolutions((prev) =>
          prev.map((s) => (s.id === solutionId ? { ...s, upvotes: updated.upvotes } : s)),
        );
        useToastStore.getState().showToast('Đã upvote thành công!', 'success', 2500);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          useToastStore.getState().showToast('Bạn đã upvote bài này rồi!', 'warning');
        } else if (status === 401) {
          useToastStore.getState().showToast('Vui lòng đăng nhập để upvote!', 'info');
        } else {
          useToastStore.getState().showToast('Không thể upvote. Vui lòng thử lại!', 'error');
        }
      } finally {
        setUpvotingId(null);
      }
    },
    [challengeId, upvotingId],
  );

  return {
    // Data
    solutions,
    loading,
    // Publish modal
    showModal,
    openModal,
    closeModal,
    title,
    setTitle,
    content,
    setContent,
    file,
    setFile,
    uploading,
    handlePublish,
    // Upvote
    upvotingId,
    handleUpvote,
  };
}
