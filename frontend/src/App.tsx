import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { ToastContainer } from './views/components/Toast';

import AuthLayout from './views/layouts/AuthLayout';
import MainLayout from './views/layouts/MainLayout';
import LoginPage from './views/pages/LoginPage';
import ChallengesPage from './views/pages/ChallengesPage';
import ChallengeDetailPage from './views/pages/ChallengeDetailPage';
import AdminPage from './views/pages/AdminPage';

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
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Navigate to="/challenges" replace />} />
        
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
        
        <Route path="*" element={<Navigate to="/challenges" replace />} />
      </Routes>
    </>
  );
}

export default App;
