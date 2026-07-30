/**
 * Zustand Global Store — Auth & Theme (Global Model trong MVVM).
 * Thành viên KHÔNG lưu auth state local, phải dùng store này.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '../models/api.types';

// ==========================================
// AUTH STORE
// ==========================================

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  setUser: (user: UserResponse | null) => void;
  logout: () => void;
  /** Cập nhật avatar_url trong store ngay sau khi upload — Header tự re-render */
  updateAvatar: (avatarUrl: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateAvatar: (avatarUrl) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar_url: avatarUrl } : null,
        })),
    }),
    {
      name: 'ictu-auth',   // Key trong localStorage (chỉ lưu metadata, KHÔNG lưu token)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ==========================================
// THEME STORE
// ==========================================

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ictu-theme' }
  )
);

export * from './toastStore';
