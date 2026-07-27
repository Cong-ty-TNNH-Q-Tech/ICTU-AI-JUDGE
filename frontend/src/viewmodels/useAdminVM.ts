/**
 * useAdminVM — ViewModels cho Admin Dashboard (UC09, UC12).
 * [OWNER] Thành viên phụ trách: Admin Module
 */
import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { challengeService } from '../services/challengeService';
import type { Challenge, UserResponse, PaginatedResponse, ChallengeCreateRequest, ChallengeUpdateRequest } from '../models/api.types';

export function useAdminUsersVM(options: { page?: number; size?: number; q?: string } = {}) {
  const [data, setData] = useState<PaginatedResponse<UserResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getUsers(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.size, options.q]); // eslint-disable-line

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = useCallback(async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      await fetchUsers(); // Refresh sau khi update
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  }, [fetchUsers]);

  return { users: data?.items ?? [], meta: data, loading, error, refetch: fetchUsers, toggleUserStatus };
}

export function useAdminChallengesVM(options: { page?: number; size?: number; status?: string } = {}) {
  const [data, setData] = useState<PaginatedResponse<Challenge> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin được xem toàn bộ (bao gồm DRAFT)
      const result = await challengeService.list(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách bài thi');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.size, options.status]); // eslint-disable-line

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const createChallenge = useCallback(async (payload: ChallengeCreateRequest) => {
    try {
      await challengeService.create(payload);
      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi tạo bài thi');
      throw err;
    }
  }, [fetchChallenges]);

  const updateChallenge = useCallback(async (id: string, payload: ChallengeUpdateRequest) => {
    try {
      await challengeService.update(id, payload);
      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật bài thi');
      throw err;
    }
  }, [fetchChallenges]);

  const deleteChallenge = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thi này?')) return;
    try {
      await challengeService.delete(id);
      await fetchChallenges();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa bài thi');
    }
  }, [fetchChallenges]);

  return { 
    challenges: data?.items ?? [], 
    meta: data, 
    loading, 
    error, 
    refetch: fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge
  };
}
