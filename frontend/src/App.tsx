import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useToastStore } from './store/toastStore';
import { authEventBus } from './core/authEventBus';
import ErrorBoundary from './views/components/ErrorBoundary';
import { ToastContainer } from './views/components/Toast';

import AuthLayout from './views/layouts/AuthLayout';
import MainLayout from './views/layouts/MainLayout';
const LandingPage = React.lazy(() => import('./views/pages/LandingPage'));
const LoginPage = React.lazy(() => import('./views/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./views/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./views/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./views/pages/ResetPasswordPage'));
const ChallengesPage = React.lazy(() => import('./views/pages/ChallengesPage'));
const ChallengeDetailPage = React.lazy(() => import('./views/pages/ChallengeDetailPage'));
const ContestListPage = React.lazy(() => import('./views/pages/ContestListPage'));
const ContestDetailPage = React.lazy(() => import('./views/pages/ContestDetailPage'));
const AdminPage = React.lazy(() => import('./views/pages/AdminPage'));
const ProfilePage = React.lazy(() => import('./views/pages/ProfilePage'));
const TeamPage = React.lazy(() => import('./views/pages/TeamPage'));
const JoinTeamPage = React.lazy(() => import('./views/pages/JoinTeamPage'));

// Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
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
            <Navigate to={`/profile/${useAuthStore.getState().user?.id ?? ''}`} replace />
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
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
