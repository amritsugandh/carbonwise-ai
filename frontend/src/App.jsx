import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import History from './pages/History';
import Predictions from './pages/Predictions';
import Compare from './pages/Compare';
import Goals from './pages/Goals';
import Challenges from './pages/Challenges';
import Streak from './pages/Streak';
import EcoNews from './pages/EcoNews';
import AICoach from './pages/AICoach';
import Leaderboard from './pages/Leaderboard';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"   element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/calculator"  element={<ErrorBoundary><Calculator /></ErrorBoundary>} />
            <Route path="/history"     element={<ErrorBoundary><History /></ErrorBoundary>} />
            <Route path="/predictions" element={<ErrorBoundary><Predictions /></ErrorBoundary>} />
            <Route path="/compare"     element={<ErrorBoundary><Compare /></ErrorBoundary>} />
            <Route path="/goals"       element={<ErrorBoundary><Goals /></ErrorBoundary>} />
            <Route path="/challenges"  element={<ErrorBoundary><Challenges /></ErrorBoundary>} />
            <Route path="/streak"      element={<ErrorBoundary><Streak /></ErrorBoundary>} />
            <Route path="/eco-news"    element={<ErrorBoundary><EcoNews /></ErrorBoundary>} />
            <Route path="/ai-coach"    element={<ErrorBoundary><AICoach /></ErrorBoundary>} />
            <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
            <Route path="/reports"     element={<ErrorBoundary><Reports /></ErrorBoundary>} />
            <Route path="/profile"     element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
