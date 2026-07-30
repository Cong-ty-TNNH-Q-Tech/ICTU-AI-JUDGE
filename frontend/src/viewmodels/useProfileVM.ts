/**
 * useProfileVM — ViewModel cho Profile page (Issue #30).
 * Chuẩn MVVM: fetch data, handle upload, expose state cho View.
 * View (ProfilePage) KHÔNG gọi API trực tiếp — chỉ nhận props từ ViewModel.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { userService } from '../services/userService';
import { useAuthStore } from '../store';
import type { UserProfile, UpdateProfileRequest, UserSolution } from '../models/api.types';

export function useProfileVM(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Solutions list state
  const [solutions, setSolutions] = useState<UserSolution[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile(userId);
      setProfile(data);
    } catch {
      setError('Không thể tải hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch solutions sau khi có userId
  const fetchSolutions = useCallback(async () => {
    if (!userId) return;
    setLoadingSolutions(true);
    try {
      const data = await userService.getUserSolutions(userId);
      setSolutions(data);
    } catch {
      // Không báo lỗi — danh sách trống là bình thường
      setSolutions([]);
    } finally {
      setLoadingSolutions(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  // Mở Edit modal và fill form từ profile hiện tại
  const openEdit = useCallback(() => {
    if (!profile) return;
    setEditForm({
      github_url: profile.github_url ?? '',
      linkedin_url: profile.linkedin_url ?? '',
    });
    setSaveError(null);
    setIsEditing(true);
  }, [profile]);

  const closeEdit = useCallback(() => setIsEditing(false), []);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await userService.updateProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(detail || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [editForm]);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingAvatar(true);
      setAvatarError(null);
      try {
        const { avatar_url } = await userService.uploadAvatar(file);
        // Cập nhật local state ngay lập tức (hiện avatar mới trên ProfilePage)
        setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
        // Cập nhật Zustand store — dùng getState() để chắc chắn không bị stale closure
        // trong async context → Header re-render ngay
        useAuthStore.getState().updateAvatar(avatar_url);
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setAvatarError(detail || 'Upload ảnh thất bại.');
      } finally {
        setUploadingAvatar(false);
        // Reset file input để có thể chọn cùng file lại
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [],  // Không cần dependencies vì dùng getState()
  );

  return {
    // Data
    profile,
    loading,
    error,
    // Edit modal
    isEditing,
    editForm,
    setEditForm,
    saving,
    saveError,
    openEdit,
    closeEdit,
    handleSaveProfile,
    // Avatar
    uploadingAvatar,
    avatarError,
    fileInputRef,
    handleAvatarClick,
    handleAvatarChange,
    // Solutions list
    solutions,
    loadingSolutions,
  };
}
