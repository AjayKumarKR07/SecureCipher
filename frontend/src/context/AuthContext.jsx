import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentUser,
  loginUser,
  requestRegisterOTP,
  verifyRegisterOTP,
  logoutUser,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const initAuth = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const userData = await fetchCurrentUser();
        if (userData) {
          setUser(userData);
        } else {
          clearAuthToken();
          setUser(null);
        }
      }
    } catch (err) {
      console.warn('Initial session check failed:', err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async ({ email, password, rememberMe = false }) => {
    setAuthError(null);
    try {
      const data = await loginUser({ email, password, rememberMe });
      setAuthToken(data.access_token, rememberMe);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const requestOTP = async ({ fullName, email, password }) => {
    setAuthError(null);
    try {
      const data = await requestRegisterOTP({ fullName, email, password });
      return { success: true, data };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const verifyOTPAndRegister = async ({ fullName, email, password, otp }) => {
    setAuthError(null);
    try {
      const data = await verifyRegisterOTP({ fullName, email, password, otp });
      setAuthToken(data.access_token, false);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setAuthError(null);
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    login,
    requestOTP,
    verifyOTPAndRegister,
    logout,
    refreshUser: initAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
