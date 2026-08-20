import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useToastStore } from './store/toastStore';
import { authEventBus } from './core/authEventBus';
import ErrorBoundary from './views/components/ErrorBoundary';
import { ToastContainer } from './views/components/Toast';

import AuthLayout from './views/layouts/AuthLayout';
import MainLayout from './views/layouts/MainLayout';
import LandingPage from './views/pages/LandingPage';
import LoginPage from './views/pages/LoginPage';
import RegisterPage from './views/pages/RegisterPage';
import ForgotPasswordPage from './views/pages/ForgotPasswordPage';
import ResetPasswordPage from './views/pages/ResetPasswordPage';
import ChallengesPage from './views/pages/ChallengesPage';
import ChallengeDetailPage from './views/pages/ChallengeDetailPage';
import ContestListPage from './views/pages/ContestListPage';
import ContestDetailPage from './views/pages/ContestDetailPage';
import AdminPage from './views/pages/AdminPage';
// Issue #30 — Profile
import ProfilePage from './views/pages/ProfilePage';

// Team pages — từ nhánh main
import TeamPage from './views/pages/TeamPage';
import JoinTeamPage from './views/pages/JoinTeamPage';

// Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProfileRedirect = () => {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={`/profile/${user?.id ?? ''}`} replace />;
};

// ---- 401 Handler (module-level dedup) ----
// ⚠️ ĐẶT NGOÀI COMPONENT APP VÌ:
//    - handleUnauthorized dùng module-level flag _isHandling401 để dedup
//    - Nếu đặt trong App component → mỗi re-render tạo closure mới → mất dedup
//    - Hàm khai báo ở module scope có reference ổn định → an toàn với useEffect []
let _isHandling401 = false;

function handleUnauthorized() {
  if (_isHandling401) return;
  _isHandling401 = true;

  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/') {
    try {
      sessionStorage.setItem('ictu-redirect-after-login', currentPath + window.location.search);
    } catch { /* sessionStorage có thể throw trong private mode */ }
  }

  useToastStore.getState().showToast(
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    'warning',
    6000
  );

  useAuthStore.getState().logout();

  setTimeout(() => { _isHandling401 = false; }, 1000);
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/challenges" replace />;

  return <>{children}</>;
};

function App() {
  // Lắng nghe sự kiện unauthorized từ apiClient interceptor
  useEffect(() => {
    return authEventBus.on(handleUnauthorized);
  }, []);

  return (
    <ErrorBoundary>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />

        <Route path="/register" element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        } />

        <Route path="/forgot-password" element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        } />

        <Route path="/reset-password" element={
          <AuthLayout>
            <ResetPasswordPage />
          </AuthLayout>
        } />

        <Route path="/challenges" element={
          <ProtectedRoute>
            <MainLayout>
              <ChallengesPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/challenges/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ChallengeDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Contests: public endpoints — anonymous co the xem PUBLISHED contests */}
        <Route path="/contests" element={
          <MainLayout>
            <ContestListPage />
          </MainLayout>
        } />

        <Route path="/contests/:id" element={
          <MainLayout>
            <ContestDetailPage />
          </MainLayout>
        } />

        <Route path="/admin" element={
          <AdminRoute>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </AdminRoute>
        } />

        {/* Issue #30 — Profile page */}
        <Route path="/profile/me" element={
          <ProtectedRoute>
            <ProfileRedirect />
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        } />

        {/* Team pages */}
        <Route path="/teams/join" element={
          <ProtectedRoute>
            <MainLayout>
              <JoinTeamPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/teams/:teamId" element={
          <ProtectedRoute>
            <MainLayout>
              <TeamPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/challenges" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
