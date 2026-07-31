import { useState, useCallback, useEffect } from 'react';
import { ContestService } from '../services/contestService';
import type { Challenge, Contest } from '../models/api.types';

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
