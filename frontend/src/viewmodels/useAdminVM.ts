/**
 * useAdminVM — ViewModels cho Admin Dashboard (UC09, UC12).
 * [OWNER] Thành viên phụ trách: Admin Module
 *
 * Cải tiến theo Admin UX Review:
 * - Thêm updatingRoleId: inline loading spinner khi cập nhật Role
 * - Thêm togglingStatusId: inline loading spinner khi Khóa/Mở khóa
 * - Tách exportingLeaderboard state: 2 nút Export Pub & Priv hoạt động độc lập
 * - Toast thông báo qua useToastStore (thay thế alert/window.confirm)
 * - ConfirmationModal dùng chung xử lý destructive actions ở tầng View
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
  Participant,
  UserCreateRequest,
  UserUpdateRequest,
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

  const createUser = useCallback(async (data: UserCreateRequest) => {
    try {
      await adminService.createUser(data);
      await fetchUsers();
      useToastStore.getState().showToast('Thêm tài khoản thành công', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo tài khoản';
      useToastStore.getState().showToast(msg, 'error');
      throw err;
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, data: UserUpdateRequest) => {
    try {
      await adminService.updateUser(userId, data);
      await fetchUsers();
      useToastStore.getState().showToast('Cập nhật tài khoản thành công', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật tài khoản';
      useToastStore.getState().showToast(msg, 'error');
      throw err;
    }
  }, [fetchUsers]);

  const importUsersCSV = useCallback(async (file: File) => {
    try {
      const result = await adminService.importUsersCSV(file);
      await fetchUsers();
      useToastStore.getState().showToast(`Import thành công ${result.success} tài khoản`, 'success');
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi import file CSV';
      useToastStore.getState().showToast(msg, 'error');
      throw err;
    }
  }, [fetchUsers]);

  return {
    users: data?.items ?? [],
    meta: data,
    loading,
    error,
    updatingRoleId,
    togglingStatusId,
    refetch: fetchUsers,
    toggleUserStatus,
    updateUserRole,
    createUser,
    updateUser,
    importUsersCSV,
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
    async (payload: ChallengeCreateRequest, groundTruthFile: File, metricScriptFile?: File, publicTestSplitRatio: number = 30) => {
      try {
        const challenge = await challengeService.create(payload);
        await challengeService.uploadSecrets(challenge.id, groundTruthFile, metricScriptFile, publicTestSplitRatio);
        await fetchChallenges();
        useToastStore.getState().showToast('Tạo bài thi thành công! 🎉', 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi tạo bài thi hoặc upload file',
          'error'
        );
        throw err;
      }
    },
    [fetchChallenges]
  );

  const updateChallenge = useCallback(
    async (id: string, payload: ChallengeUpdateRequest, groundTruthFile?: File, metricScriptFile?: File, publicTestSplitRatio: number = 30) => {
      try {
        await challengeService.update(id, payload);
        if (groundTruthFile) {
          await challengeService.uploadSecrets(id, groundTruthFile, metricScriptFile, publicTestSplitRatio);
        }
        await fetchChallenges();
        useToastStore.getState().showToast('Cập nhật bài thi thành công!', 'success');
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi cập nhật bài thi hoặc file',
          'error'
        );
        throw err;
      }
    },
    [fetchChallenges]
  );

  /**
   * Xóa bài thi — Confirmation được xử lý bởi ConfirmationModal ở tầng View.
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
    async (challengeId: string, type: 'public' | 'private' = 'private', challengeTitle: string = '') => {
      setExportingLeaderboard({ id: challengeId, type });
      try {
        const blob = await adminService.exportLeaderboard(challengeId, type);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leaderboard_${type}_${(challengeTitle || challengeId).replace(/\s+/g, '_')}.csv`;
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

// ==========================================
// Whitelist Management ViewModel (Issue #91)
// ==========================================

/**
 * useWhitelistVM — Quản lý Whitelist thí sinh cho bài thi COMPETITION (UC10).
 * Chỉ dùng trong WhitelistManageModal.
 */
export function useWhitelistVM(challengeId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await challengeService.listParticipants(challengeId, {
        page,
        size: PAGE_SIZE,
      });

      setParticipants(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      useToastStore.getState().showToast(
        err instanceof Error ? err.message : 'Lỗi tải danh sách whitelist',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [challengeId, page]);



  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  /**
   * addByUserIds — Nhập chuỗi thô (Email / MSSV / UUID).
   * Backend tự resolve identifier → user_id.
   * Returns true nếu thành công (báo hiệu cho View reset textarea).
   */
  const addByUserIds = useCallback(
    async (rawInput: string): Promise<boolean> => {
      const identifiers = rawInput
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (identifiers.length === 0) {
        useToastStore.getState().showToast(
          'Vui lòng nhập ít nhất 1 định danh (Email, MSSV hoặc UUID).',
          'warning'
        );
        return false;
      }

      setAdding(true);
      try {
        const result = await challengeService.addParticipantsByIdentifiers(challengeId, identifiers);
        await fetchParticipants();

        // Cảnh báo nếu có identifier không tìm thấy
        if (result.not_found && result.not_found.length > 0) {
          useToastStore.getState().showToast(
            `✅ Thêm ${result.added} thí sinh. ⚠️ Không tìm thấy: ${result.not_found.join(', ')}`,
            'warning'
          );
        } else {
          useToastStore.getState().showToast(
            `✅ ${result.detail}`,
            'success'
          );
        }
        return true;
      } catch (err) {
        useToastStore.getState().showToast(
          err instanceof Error ? err.message : 'Lỗi thêm thí sinh vào Whitelist',
          'error'
        );
        return false;
      } finally {
        setAdding(false);
      }
    },
    [challengeId, fetchParticipants]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    participants,
    total,
    totalPages,
    page,
    setPage,
    loading,
    adding,
    refetch: fetchParticipants,
    addByUserIds,
  };
}
