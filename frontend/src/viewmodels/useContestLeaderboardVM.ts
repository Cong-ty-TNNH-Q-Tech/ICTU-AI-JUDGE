import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import type { ContestLeaderboardResponse, LeaderboardType } from '../models/api.types';

export function useContestLeaderboardVM(contestId: string) {
  const [data, setData] = useState<ContestLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('public');

  const fetchLeaderboard = useCallback(async (silent: boolean = false) => {
    if (!contestId) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await challengeService.getContestLeaderboard(contestId, { 
        type: leaderboardType
      });
      setData(result);
    } catch (error: unknown) {
      if (!silent) {
        const err = error as { response?: { status?: number }; message?: string };
        if (err?.response?.status === 403 && leaderboardType === 'private') {
          setError('Bảng xếp hạng Private chỉ hiển thị sau khi cuộc thi kết thúc.');
          setData(null);
        } else {
          setError(err instanceof Error ? err.message : 'Lỗi tải bảng xếp hạng tổng');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [contestId, leaderboardType]);

  useEffect(() => {
    fetchLeaderboard();

    // Polling 30s
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { data, loading, error, leaderboardType, setLeaderboardType, refetch: fetchLeaderboard };
}
