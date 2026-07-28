/**
 * useChallengeVM — ViewModel cho Challenge List & Detail (UC03, UC07).
 * [OWNER] Thành viên phụ trách: Challenge Module
 */
import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import type { Challenge, PaginatedResponse, LeaderboardEntry, Submission, LeaderboardType } from '../models/api.types';
import { teamService } from '../services/teamService';
import { useAuthStore } from '../store';
import { useToastStore } from '../store/toastStore';


interface UseChallengeListOptions {
  status?: string;
  page?: number;
  size?: number;
}

export function useChallengeListVM(options: UseChallengeListOptions = {}) {
  const [data, setData] = useState<PaginatedResponse<Challenge> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.list(options);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách bài thi');
      setData({ items: [], total: 0, page: 1, size: 9, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [options.status, options.page, options.size]);  // eslint-disable-line

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return { challenges: data?.items ?? [], meta: data, loading, error, refetch: fetchChallenges };
}

export function useChallengeDetailVM(challengeId: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const fetchDetail = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.getById(challengeId);
      setChallenge(result);
      
      if (isAuthenticated) {
        try {
          const myTeams = await teamService.getMyTeams({ size: 100 });
          const team = myTeams.items.find(t => t.challenge_id === challengeId);
          if (team) {
            setIsEnrolled(true);
            setTeamId(team.id);
          } else {
            setIsEnrolled(false);
            setTeamId(null);
          }
        } catch (teamErr) {
          console.error("Failed to fetch teams:", teamErr);
          setIsEnrolled(false);
          setTeamId(null);
        }
      } else {
        setIsEnrolled(false);
        setTeamId(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải bài thi');
    } finally {
      setLoading(false);
    }
  }, [challengeId, isAuthenticated]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const enroll = useCallback(async () => {
    const result = await challengeService.enroll(challengeId);
    return result.team_id;
  }, [challengeId]);

  return { challenge, loading, error, isEnrolled, teamId, enroll, refetch: fetchDetail };
}

export function useLeaderboardVM(challengeId: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('public');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const size = 20;

  const fetchLeaderboard = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.getLeaderboard(challengeId, { 
        type: leaderboardType,
        page,
        size
      });
      setEntries(result?.items ?? []);
      setTotalCount(result?.total ?? 0);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 403 && leaderboardType === 'private') {
        setError('Bảng xếp hạng Private chỉ hiển thị sau khi cuộc thi kết thúc.');
        setEntries([]);
      } else {
        setError(err instanceof Error ? err.message : 'Lỗi tải bảng xếp hạng');
      }
    } finally {
      setLoading(false);
    }
  }, [challengeId, leaderboardType, page, size]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Reset page to 1 when changing leaderboard type
  useEffect(() => {
    setPage(1);
  }, [leaderboardType]);

  return { entries, loading, error, leaderboardType, setLeaderboardType, page, setPage, totalCount, size, refetch: fetchLeaderboard };
}

export function useSubmissionsVM(challengeId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.listSubmissions(challengeId);
      setSubmissions(result?.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử nộp bài');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const submitFile = useCallback(async (file: File) => {
    if (!challengeId) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await challengeService.submitFile(challengeId, file);
      setSubmitSuccess('Nộp bài thành công!');
      useToastStore.getState().showToast('Nộp bài thành công!', 'success');
      await fetchSubmissions(); // Refresh list after submit
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
      setSubmitError(message);
      useToastStore.getState().showToast(message, 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [challengeId, fetchSubmissions]);

  return { submissions, loading, error, submitting, submitError, submitSuccess, submitFile, refetch: fetchSubmissions };
}
