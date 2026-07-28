import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import ErrorBoundary from './views/components/ErrorBoundary';

import AuthLayout from './views/layouts/AuthLayout';
import MainLayout from './views/layouts/MainLayout';
import LandingPage from './views/pages/LandingPage';
import LoginPage from './views/pages/LoginPage';
import ChallengesPage from './views/pages/ChallengesPage';
import ChallengeDetailPage from './views/pages/ChallengeDetailPage';
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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/challenges" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={
        <AuthLayout>
          <LoginPage />
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

      <Route path="/admin" element={
        <AdminRoute>
          <MainLayout>
            <AdminPage />
          </MainLayout>
        </AdminRoute>
      } />

      {/* Issue #30 — Profile page (công khai, không cần đăng nhập) */}
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
    </ErrorBoundary>
  );
}

export default App;
