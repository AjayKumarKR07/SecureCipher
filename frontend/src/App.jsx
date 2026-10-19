import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import AESPage from './pages/AESPage';
import AESFileCryptoPage from './pages/AESFileCryptoPage';
import RSAPage from './pages/RSAPage';
import DiffieHellmanPage from './pages/DiffieHellmanPage';
import SHA256Page from './pages/SHA256Page';
import MD5Page from './pages/MD5Page';
import DESPage from './pages/DESPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { fetchHealth, fetchDatabaseHealth } from './services/api';

// Redirects already-authenticated users away from public-only routes like /login and /register.
// Renders null while the auth session is loading to prevent a redirect flash.
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// Route Guard: Requires an authenticated user session.
// If logged out, redirects immediately to /register (with intent state to return after sign-up/login)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  return user ? children : <Navigate to="/register" state={{ from: location }} replace />;
}

// On the root path: show authenticated Workspace Dashboard if logged in, otherwise public Landing HomePage
function HomeOrDashboard({ backendHealth, dbHealth, onRefresh }) {
  const { user } = useAuth();
  if (user) {
    return (
      <Dashboard
        backendHealth={backendHealth}
        dbHealth={dbHealth}
        onRefresh={onRefresh}
      />
    );
  }
  return (
    <HomePage
      backendHealth={backendHealth}
      dbHealth={dbHealth}
      onRefresh={onRefresh}
    />
  );
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [backend, db] = await Promise.all([
        fetchHealth(),
        fetchDatabaseHealth(),
      ]);
      setBackendHealth(backend);
      setDbHealth(db);
    } catch (err) {
      console.error('Telemetry refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkTelemetry();
    // Auto-refresh telemetry every 30 seconds
    const interval = setInterval(checkTelemetry, 30000);
    return () => clearInterval(interval);
  }, [checkTelemetry]);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Layout
              backendHealth={backendHealth}
              dbHealth={dbHealth}
              onRefresh={checkTelemetry}
              isRefreshing={isRefreshing}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <HomeOrDashboard
                      backendHealth={backendHealth}
                      dbHealth={dbHealth}
                      onRefresh={checkTelemetry}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard
                        backendHealth={backendHealth}
                        dbHealth={dbHealth}
                        onRefresh={checkTelemetry}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <HomePage
                      backendHealth={backendHealth}
                      dbHealth={dbHealth}
                      onRefresh={checkTelemetry}
                    />
                  }
                />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
                <Route path="/algorithm/aes" element={<ProtectedRoute><AESPage onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/aes-file" element={<ProtectedRoute><AESFileCryptoPage onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/rsa" element={<ProtectedRoute><RSAPage onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/diffie-hellman" element={<ProtectedRoute><DiffieHellmanPage onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/sha-256" element={<ProtectedRoute><SHA256Page onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/md5" element={<ProtectedRoute><MD5Page onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route path="/algorithm/des" element={<ProtectedRoute><DESPage onOperationSuccess={checkTelemetry} /></ProtectedRoute>} />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage dbHealth={dbHealth} />
                    </ProtectedRoute>
                  }
                />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
