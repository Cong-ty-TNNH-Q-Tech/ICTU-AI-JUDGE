/**
 * useChallengeVM — ViewModel cho Challenge List & Detail (UC03, UC07).
 * [OWNER] Thành viên phụ trách: Challenge Module
 * TODO: Thêm logic pagination, filter state vào đây.
 */
import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import type { Challenge, PaginatedResponse } from '../models/api.types';

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách bài thi');
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

  const fetchDetail = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.getById(challengeId);
      setChallenge(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải bài thi');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const enroll = useCallback(async () => {
    const result = await challengeService.enroll(challengeId);
    return result.team_id;
  }, [challengeId]);

  return { challenge, loading, error, enroll, refetch: fetchDetail };
}
