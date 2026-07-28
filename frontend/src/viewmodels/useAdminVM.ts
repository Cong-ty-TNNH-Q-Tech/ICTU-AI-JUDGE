/**
 * useAdminVM — ViewModels cho Admin Dashboard (UC09, UC12).
 * [OWNER] Thành viên phụ trách: Admin Module
 *
 * Cải tiến theo Admin UX Review:
 * - Thêm updateUserRole với inline loading state (updatingRoleId)
 * - Tách exportingLeaderboard state để phân biệt "Export Pub" vs "Export Priv"
 * - Hỗ trợ pagination (page, size) và filter (status, q) đầy đủ
 * - Thay alert() bằng toast thông qua useToastStore
 */
import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { challengeService } from '../services/challengeService';
import { useToastStore } from '../store';
import type {
  Challenge,
  UserResponse,
  PaginatedResponse,
  ChallengeCreateRequest,
  ChallengeUpdateRequest,
  UserRole,
} from '../models/api.types';

// ==========================================
// User Management ViewModel
// ==========================================

export function useAdminUsersVM(options: { page?: number; size?: number; q?: string } = {}) {
  const [data, setData] = useState<PaginatedResponse<UserResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** ID của user đang được cập nhật Role — dùng để hiện spinner inline */
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  /** ID của user đang được toggle trạng thái active */
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

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

  /** Khóa / Mở khóa tài khoản. Có inline loading và toast thông báo. */
  const toggleUserStatus = useCallback(async (userId: string, currentStatus: boolean) => {
    setTogglingStatusId(userId);
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      await fetchUsers();
      useToastStore.getState().showToast(
        currentStatus ? 'Đã khóa tài khoản thành công.' : 'Đã mở khóa tài khoản thành công.',
        'success'
      );
    } catch (err) {
      useToastStore.getState().showToast(
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái',
        'error'
      );
    } finally {
      setTogglingStatusId(null);
    }
  }, [fetchUsers]);

  /** Cập nhật Role với inline loading spinner. Nếu lỗi, Dropdown sẽ revert về giá trị cũ. */
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    setUpdatingRoleId(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      await fetchUsers();
      useToastStore.getState().showToast(`Đã cập nhật role thành ${newRole}.`, 'success');
    } catch (err) {
      useToastStore.getState().showToast(
        err instanceof Error ? err.message : 'Không thể cập nhật role',
        'error'
      );
      // Refresh để revert về giá trị cũ từ server
      await fetchUsers();
    } finally {
      setUpdatingRoleId(null);
    }
  }, [fetchUsers]);

  return {
    users: data?.items ?? [],
    meta: data,
    loading,
    error,
    refetch: fetchUsers,
    toggleUserStatus,
    updateUserRole,
    updatingRoleId,
    togglingStatusId,
  };
}

// ==========================================
// Challenge Management ViewModel
// ==========================================

export function useAdminChallengesVM(options: { page?: number; size?: number; status?: string } = {}) {
  const [data, setData] = useState<PaginatedResponse<Challenge> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Tách biệt state loading của 2 nút Export.
   * Thay thế exportingId (string | null) để tránh cả 2 nút cùng hiện "Exporting..."
   */
  const [exportingLeaderboard, setExportingLeaderboard] = useState<{
    id: string;
    type: 'public' | 'private';
  } | null>(null);

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

  const createChallenge = useCallback(
    async (payload: ChallengeCreateRequest, groundTruthFile?: File, metricScriptFile?: File) => {
      try {
        await challengeService.create(payload, groundTruthFile, metricScriptFile);
        await fetchChallenges();
        useToastStore.getState().showToast('Tạo bài thi thành công! 🎉', 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi tạo bài thi',
          'error'
        );
        throw err;
      }
    },
    [fetchChallenges]
  );

  const updateChallenge = useCallback(
    async (id: string, payload: ChallengeUpdateRequest, groundTruthFile?: File, metricScriptFile?: File) => {
      try {
        await challengeService.update(id, payload, groundTruthFile, metricScriptFile);
        await fetchChallenges();
        useToastStore.getState().showToast('Cập nhật bài thi thành công!', 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi cập nhật bài thi',
          'error'
        );
        throw err;
      }
    },
    [fetchChallenges]
  );

  /**
   * Xóa bài thi — KHÔNG dùng window.confirm() nữa.
   * Confirmation sẽ được xử lý bởi ConfirmationModal ở tầng View.
   */
  const deleteChallenge = useCallback(
    async (id: string) => {
      try {
        await challengeService.delete(id);
        await fetchChallenges();
        useToastStore.getState().showToast('Đã xóa bài thi thành công.', 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi xóa bài thi',
          'error'
        );
      }
    },
    [fetchChallenges]
  );

  /** Tải CSV bảng xếp hạng — Tách biệt state để 2 nút không ảnh hưởng nhau. */
  const downloadLeaderboardCSV = useCallback(
    async (challengeId: string, type: 'public' | 'private', challengeTitle: string) => {
      setExportingLeaderboard({ id: challengeId, type });
      try {
        const blob = await adminService.downloadLeaderboardCSV(challengeId, type);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leaderboard_${type}_${challengeTitle.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        useToastStore.getState().showToast(`Tải xuống ${type === 'public' ? 'Public' : 'Private'} Leaderboard thành công!`, 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi xuất CSV',
          'error'
        );
      } finally {
        setExportingLeaderboard(null);
      }
    },
    []
  );

  return {
    challenges: data?.items ?? [],
    meta: data,
    loading,
    error,
    refetch: fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    downloadLeaderboardCSV,
    exportingLeaderboard,
  };
}
