/**
 * ProfilePage — View (Dumb Component) cho hồ sơ cá nhân (Issue #30).
 * Nhận toàn bộ state từ useProfileVM — không gọi API trực tiếp.
 * Hiển thị: Avatar, Stats Cards, Solutions list, Edit modal.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useProfileVM } from '../../viewmodels/useProfileVM';
import { useToastStore } from '../../store/toastStore';
import BadgeGrid from '../components/BadgeGrid';
import ProfileCover from '../../assets/profile-cover.png';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;
  // Global toast is mounted in App.tsx

  const {
    profile,
    loading,
    error,
    isEditing,
    editForm,
    setEditForm,
    saving,
    saveError,
    openEdit,
    closeEdit,
    handleSaveProfile,
    uploadingAvatar,
    avatarError,
    fileInputRef,
    handleAvatarClick,
    handleAvatarChange,
    solutions,
    loadingSolutions,
  } = useProfileVM(userId ?? '');

  // Show toast khi avatar error
  React.useEffect(() => {
    if (avatarError) useToastStore.getState().showToast(avatarError, 'error');
  }, [avatarError]);

  // ==========================================
  // Loading / Error states
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400">{error || 'Không tìm thấy hồ sơ.'}</p>
      </div>
    );
  }

  // ==========================================
  // Avatar helper
  // ==========================================
  const initials = profile.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const badgeStats = {
    totalSubmissions: profile.total_submissions,
    totalSolutions: profile.total_solutions,
    bestRank: profile.best_rank ?? null,
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ======== Profile Card with Cover ======== */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        {/* Cover Banner — Kaggle-style abstract art */}
        <div className="h-40 lg:h-48 relative overflow-hidden">
          <img
            src={ProfileCover}
            alt="cover"
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-6 lg:px-8 pb-6 relative">
          {/* Avatar — floating over cover */}
          <div className="relative inline-block -mt-16 mb-4">
            <div
              className={`w-28 h-28 rounded-full ring-4 ring-white dark:ring-slate-900 overflow-hidden bg-white dark:bg-slate-900 shadow-lg ${
                isOwner ? 'cursor-pointer group' : ''
              }`}
              onClick={isOwner ? handleAvatarClick : undefined}
              title={isOwner ? 'Nhấn để thay đổi ảnh' : undefined}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-extrabold">
                  {initials}
                </div>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Name + Links + Edit button */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                {profile.full_name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{profile.email}</p>

              {/* Social links */}
              <div className="flex items-center gap-4 mt-3">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {!profile.github_url && !profile.linkedin_url && isOwner && (
                  <button
                    onClick={openEdit}
                    className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    + Thêm liên kết mạng xã hội
                  </button>
                )}
              </div>
            </div>

            {/* Edit button — chỉ hiện với owner */}
            {isOwner && (
              <button
                onClick={openEdit}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-transparent dark:hover:bg-white/5 dark:border-slate-700 dark:text-slate-300 rounded-full font-semibold text-sm transition-colors shadow-sm"
              >
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======== Stats Cards ======== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Bài nộp',
            value: profile.total_submissions,
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50 dark:bg-blue-500/10',
            textColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Giải pháp',
            value: profile.total_solutions,
            gradient: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50 dark:bg-purple-500/10',
            textColor: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Hạng tốt nhất',
            value: profile.best_rank != null ? `#${profile.best_rank}` : '—',
            gradient: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50 dark:bg-amber-500/10',
            textColor: 'text-amber-600 dark:text-amber-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-surface-dark rounded-xl border border-surface-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`text-3xl font-extrabold ${stat.textColor} tabular-nums`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ======== Badges Section ======== */}
      <div className="mb-6">
        <BadgeGrid stats={badgeStats} isOwner={isOwner} />
      </div>

      {/* ======== Solutions List ======== */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Giải pháp đã chia sẻ
            </h3>
            {solutions.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {solutions.length} giải pháp
              </p>
            )}
          </div>
        </div>

        {loadingSolutions ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : solutions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isOwner ? 'Bạn chưa chia sẻ giải pháp nào.' : 'Chưa có giải pháp nào được chia sẻ.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {solutions.map((sol) => (
              <div
                key={sol.id}
                className="group flex items-start justify-between gap-4 p-4 rounded-xl border border-surface-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1 truncate">
                    {sol.challenge_title}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors truncate">
                    {sol.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(sol.created_at).toLocaleDateString('vi-VN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs font-bold">{sol.upvotes}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======== Edit Profile Modal ======== */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-2xl animate-scale-in">
            <div className="p-6 lg:p-8">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">
                Chỉnh sửa hồ sơ
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    GitHub URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={editForm.github_url ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, github_url: e.target.value || null }))}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={editForm.linkedin_url ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, linkedin_url: e.target.value || null }))}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2 font-medium">{saveError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
