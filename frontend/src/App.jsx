import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AESPage from './pages/AESPage';
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
  return user ? <Navigate to="/" replace /> : children;
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
                    <Dashboard
                      backendHealth={backendHealth}
                      dbHealth={dbHealth}
                      onRefresh={checkTelemetry}
                    />
                  }
                />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/profile" element={<ProfileSettingsPage />} />
                <Route path="/algorithm/aes" element={<AESPage onOperationSuccess={checkTelemetry} />} />
                <Route path="/algorithm/rsa" element={<RSAPage onOperationSuccess={checkTelemetry} />} />
                <Route path="/algorithm/diffie-hellman" element={<DiffieHellmanPage onOperationSuccess={checkTelemetry} />} />
                <Route path="/algorithm/sha-256" element={<SHA256Page onOperationSuccess={checkTelemetry} />} />
                <Route path="/algorithm/md5" element={<MD5Page onOperationSuccess={checkTelemetry} />} />
                <Route path="/algorithm/des" element={<DESPage onOperationSuccess={checkTelemetry} />} />
                <Route
                  path="/history"
                  element={<HistoryPage dbHealth={dbHealth} />}
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
