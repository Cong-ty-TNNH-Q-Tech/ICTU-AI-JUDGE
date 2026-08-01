import { useState, useCallback, useEffect } from 'react';
import { ContestService } from '../services/contestService';
import type { Challenge, Contest, ContestCreateRequest, ContestUpdateRequest } from '../models/api.types';

// ------------------------------------------------------------------
// useContestVM — danh sách cuộc thi (ContestListPage)
// ------------------------------------------------------------------
export const useContestVM = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = useCallback(async (page: number = 1, size: number = 20, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ContestService.getContests(page, size, status);
      setContests(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setCurrentPage(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load contests';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    contests,
    total,
    totalPages,
    currentPage,
    isLoading,
    error,
    fetchContests,
  };
};

// ------------------------------------------------------------------
// useContestDetailVM — chi tiết cuộc thi + challenges con (ContestDetailPage)
// ------------------------------------------------------------------
export const useContestDetailVM = (contestId: string | undefined) => {
  const [contest, setContest] = useState<Contest | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [contestData, challengesData] = await Promise.all([
          ContestService.getContestById(contestId),
          ContestService.getChallengesByContest(contestId),
        ]);
        setContest(contestData);
        setChallenges(challengesData.items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không tìm thấy thông tin kỳ thi';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [contestId]);

  return { contest, challenges, loading, error };
};

// ------------------------------------------------------------------
// useContestManageVM — Admin CRUD (ContestManagePage)
// Encapsulate toàn bộ fetch/create/update/delete logic.
// View chỉ nhận data và callbacks từ hook — không gọi Service trực tiếp.
// ------------------------------------------------------------------
const PAGE_SIZE = 10;

export const useContestManageVM = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = useCallback(async (p: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ContestService.getContests(p, PAGE_SIZE);
      setContests(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setPage(p);
    } catch (err: unknown) {
      console.error('[useContestManageVM] fetchContests failed:', err);
      setError('Không thể tải danh sách cuộc thi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load lần đầu
  useEffect(() => {
    fetchContests(1);
  }, [fetchContests]);

  const createContest = useCallback(async (data: ContestCreateRequest): Promise<void> => {
    setIsSaving(true);
    try {
      await ContestService.createContest(data);
      // Contest mới nhất ở trang 1 (ORDER BY created_at DESC)
      await fetchContests(1);
    } catch (err: unknown) {
      console.error('[useContestManageVM] createContest failed:', err);
      const msg = err instanceof Error ? err.message : 'Không thể tạo cuộc thi.';
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [fetchContests]);

  const updateContest = useCallback(async (id: string, data: ContestUpdateRequest): Promise<void> => {
    setIsSaving(true);
    try {
      await ContestService.updateContest(id, data);
      // Giữ nguyên trang hiện tại khi update
      await fetchContests(page);
    } catch (err: unknown) {
      console.error('[useContestManageVM] updateContest failed:', err);
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật cuộc thi.';
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [fetchContests, page]);

  const deleteContest = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await ContestService.deleteContest(id);
      // Sau delete: ưu tiên giữ trang hiện tại, fallback về trang trước nếu trang trống
      const targetPage = contests.length === 1 && page > 1 ? page - 1 : page;
      await fetchContests(targetPage);
    } catch (err: unknown) {
      console.error('[useContestManageVM] deleteContest failed:', err);
      const msg = err instanceof Error ? err.message : 'Không thể xoá cuộc thi.';
      throw new Error(msg);
    } finally {
      setIsDeleting(false);
    }
  }, [fetchContests, page, contests.length]);

  const goToPage = useCallback((p: number) => {
    fetchContests(p);
  }, [fetchContests]);

  return {
    // State
    contests,
    total,
    totalPages,
    page,
    isLoading,
    isSaving,
    isDeleting,
    error,
    // Actions
    createContest,
    updateContest,
    deleteContest,
    goToPage,
  };
};
