import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';
import { JobMatchPage } from './pages/JobMatchPage';
import { ATSResultPage } from './pages/ATSResultPage';
import { ResumeOptimizePage } from './pages/ResumeOptimizePage';
import { InterviewSetupPage } from './pages/InterviewSetupPage';
import { InterviewSessionPage } from './pages/InterviewSessionPage';
import { InterviewReportPage } from './pages/InterviewReportPage';
import { CareerInsightsPage } from './pages/CareerInsightsPage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public only route (e.g. login/register when already logged in)
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing */}
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              } 
            />

            {/* Authenticated Platform Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume" 
              element={
                <ProtectedRoute>
                  <ResumeBuilderPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/job-match" 
              element={
                <ProtectedRoute>
                  <JobMatchPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ats-result" 
              element={
                <ProtectedRoute>
                  <ATSResultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume-optimize" 
              element={
                <ProtectedRoute>
                  <ResumeOptimizePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview" 
              element={
                <ProtectedRoute>
                  <InterviewSetupPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/session/:id" 
              element={
                <ProtectedRoute>
                  <InterviewSessionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/report/:id" 
              element={
                <ProtectedRoute>
                  <InterviewReportPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/career-insights" 
              element={
                <ProtectedRoute>
                  <CareerInsightsPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
