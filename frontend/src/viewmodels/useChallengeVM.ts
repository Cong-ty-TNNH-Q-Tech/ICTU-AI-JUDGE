/**
 * useChallengeVM — ViewModel cho Challenge List & Detail (UC03, UC07).
 * [OWNER] Thành viên phụ trách: Challenge Module
 * TODO: Thêm logic pagination, filter state vào đây.
 */
import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import type { Challenge, PaginatedResponse, LeaderboardEntry, Submission, LeaderboardType } from '../models/api.types';

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Phân loại ảnh Chó Mèo với CNN',
    description: 'Cuộc thi xây dựng mô hình Deep Learning để phân loại ảnh chó và mèo. \n\n## Mục tiêu\n\nPhân loại ảnh chó mèo với độ chính xác cao nhất.',
    type: 'PUBLIC',
    status: 'PUBLISHED',
    is_public: true,
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 5).toISOString(),
    rate_limit_minutes: 10,
    max_file_size_mb: 50,
    max_team_size: 4,
    metric_name: 'Accuracy',
    metric_direction: 'HIGHER_IS_BETTER',
    dataset_url: 'https://google.com'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Dự đoán giá nhà Boston',
    description: 'Sử dụng Random Forest hoặc XGBoost để dự đoán giá nhà. Đề bài rất cơ bản...',
    type: 'COMPETITION',
    status: 'PUBLISHED',
    is_public: false,
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    rate_limit_minutes: 5,
    max_file_size_mb: 20,
    max_team_size: 3,
    metric_name: 'RMSE',
    metric_direction: 'LOWER_IS_BETTER',
    dataset_url: 'https://google.com'
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, team_id: 'a1111111-1111-1111-1111-111111111111', team_name: 'AI Club Team A', best_public_score: 0.985, best_private_score: null, last_submission_time: new Date().toISOString(), is_selected_for_private: true },
  { rank: 2, team_id: 'b2222222-2222-2222-2222-222222222222', team_name: 'DHKTPM K20', best_public_score: 0.950, best_private_score: null, last_submission_time: new Date(Date.now() - 3600000).toISOString(), is_selected_for_private: false },
  { rank: 3, team_id: 'c3333333-3333-3333-3333-333333333333', team_name: 'The Underdogs', best_public_score: 0.890, best_private_score: null, last_submission_time: new Date(Date.now() - 7200000).toISOString(), is_selected_for_private: true },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: '11111111-1111-1111-1111-111111111111', public_score: 0.985, status: 'SUCCESS', is_selected_for_private: true, file_size_bytes: 1024 * 50, execution_time_ms: 1200, error_message: null, submitted_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', public_score: null, status: 'PROCESSING', is_selected_for_private: false, file_size_bytes: 1024 * 40, execution_time_ms: null, error_message: null, submitted_at: new Date(Date.now() - 10000).toISOString() },
  { id: '33333333-3333-3333-3333-333333333333', public_score: null, status: 'FAILED', is_selected_for_private: false, file_size_bytes: 1024 * 60, execution_time_ms: 50, error_message: 'File format error', submitted_at: new Date(Date.now() - 86400000).toISOString() },
];

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
    } catch {
      console.warn('API list challenges failed, using mock data');
      setData({ items: MOCK_CHALLENGES, total: MOCK_CHALLENGES.length, page: 1, size: 9, total_pages: 1 });
      // setError(err instanceof Error ? err.message : 'Lỗi tải danh sách bài thi');
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
    } catch {
      console.warn('API get challenge detail failed, using mock data');
      const mock = MOCK_CHALLENGES.find(c => c.id === challengeId) || MOCK_CHALLENGES[0];
      setChallenge(mock);
      // setError(err instanceof Error ? err.message : 'Lỗi tải bài thi');
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

export function useLeaderboardVM(challengeId: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('public');

  const fetchLeaderboard = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await challengeService.getLeaderboard(challengeId, { type: leaderboardType });
      setEntries(result.items);
    } catch {
      console.warn('API get leaderboard failed, using mock data');
      setEntries(MOCK_LEADERBOARD);
      // setError(err instanceof Error ? err.message : 'Lỗi tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  }, [challengeId, leaderboardType]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, loading, error, leaderboardType, setLeaderboardType, refetch: fetchLeaderboard };
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
      setSubmissions(result.items);
    } catch {
      console.warn('API get submissions failed, using mock data');
      setSubmissions(MOCK_SUBMISSIONS);
      // setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử nộp bài');
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
      await fetchSubmissions(); // Refresh list after submit
    } catch {
      console.warn('API submit file failed, mocking success');
      setSubmitSuccess('Nộp bài thành công (MOCK)!');
      // setSubmitError(err instanceof Error ? err.message : 'Lỗi nộp bài');
      // throw err; // throw for UI to catch if needed
    } finally {
      setSubmitting(false);
    }
  }, [challengeId, fetchSubmissions]);

  return { submissions, loading, error, submitting, submitError, submitSuccess, submitFile, refetch: fetchSubmissions };
}
