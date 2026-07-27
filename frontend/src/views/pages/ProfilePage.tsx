/**
 * ProfilePage — View (Dumb Component) cho hồ sơ cá nhân (Issue #30).
 * Nhận toàn bộ state từ useProfileVM — không gọi API trực tiếp.
 * Hiển thị: Avatar, Stats Cards, Solutions list, Edit modal.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useProfileVM } from '../../viewmodels/useProfileVM';
import { useToast } from '../components/Toast';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;
  const { showToast, ToastContainer } = useToast();

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
  } = useProfileVM(userId ?? '');

  // Show toast khi avatar error
  React.useEffect(() => {
    if (avatarError) showToast(avatarError, 'error');
  }, [avatarError, showToast]);

  // ==========================================
  // Loading / Error states
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-content-secondary dark:text-content-dark-secondary text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-content-secondary dark:text-content-dark-secondary">{error || 'Không tìm thấy hồ sơ.'}</p>
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

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ToastContainer />

      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ======== Profile Card ======== */}
      <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-gray-800 shadow-elevated overflow-hidden mb-6">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-br from-primary-500 via-purple-600 to-indigo-700 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptLTMwIDMwdjZINFYzNGg2em0wLTMwdjZINFY0aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="relative inline-block -mt-16 mb-4">
            <div
              className={`w-28 h-28 rounded-full ring-4 ring-surface dark:ring-surface-dark overflow-hidden ${isOwner ? 'cursor-pointer group' : ''}`}
              onClick={isOwner ? handleAvatarClick : undefined}
              title={isOwner ? 'Nhấn để thay đổi ảnh' : undefined}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                  {initials}
                </div>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {isOwner && (
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary-500 border-2 border-surface dark:border-surface-dark flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            )}
          </div>

          {/* Name + Links + Edit button */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-content-primary dark:text-content-dark-primary">{profile.full_name}</h1>
              <p className="text-sm text-content-secondary dark:text-content-dark-secondary mt-0.5">{profile.email}</p>

              {/* Social links */}
              <div className="flex items-center gap-3 mt-3">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-content-secondary dark:text-content-dark-secondary hover:text-primary-500 transition-colors"
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
                    className="flex items-center gap-1.5 text-sm text-content-secondary dark:text-content-dark-secondary hover:text-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {!profile.github_url && !profile.linkedin_url && isOwner && (
                  <span className="text-sm text-content-tertiary italic">Thêm Github/LinkedIn của bạn...</span>
                )}
              </div>
            </div>

            {/* Edit button — chỉ hiện với owner */}
            {isOwner && (
              <button
                onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 dark:border-gray-700 text-content-secondary dark:text-content-dark-secondary hover:border-primary-400 hover:text-primary-500 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
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
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Giải pháp',
            value: profile.total_solutions,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ),
            color: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Hạng tốt nhất',
            value: profile.best_rank != null ? `#${profile.best_rank}` : '—',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            ),
            color: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface dark:bg-surface-dark rounded-xl border border-surface-200 dark:border-gray-800 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.text} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-content-tertiary font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-content-primary dark:text-content-dark-primary mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ======== Edit Profile Modal ======== */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-gray-800 shadow-2xl animate-scale-in">
            <div className="p-6">
              <h2 className="text-xl font-bold text-content-primary dark:text-content-dark-primary mb-5">
                Chỉnh sửa hồ sơ
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">
                    GitHub URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={editForm.github_url ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, github_url: e.target.value || null }))}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-lg text-content-primary dark:text-content-dark-primary placeholder:text-content-tertiary/60 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">
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
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-lg text-content-primary dark:text-content-dark-primary placeholder:text-content-tertiary/60 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800/40 transition-all"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{saveError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium border border-surface-200 dark:border-gray-700 rounded-lg text-content-secondary dark:text-content-dark-secondary hover:bg-surface-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
