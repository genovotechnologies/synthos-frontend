'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import { authApi, type User, type LoginRequest, type RegisterRequest } from '@/lib/api';
import { isTokenExpired } from '@/lib/utils';

// A07:2021 - Secure cookie configuration
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // Strict CSRF protection
  path: '/',
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = Cookies.get('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // A07:2021 - Check if token is expired before making request
    if (isTokenExpired(token)) {
      Cookies.remove('access_token', { path: '/' });
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      Cookies.remove('access_token', { path: '/' });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    // A07:2021 - Use secure cookie options
    Cookies.set('access_token', response.access_token, COOKIE_OPTIONS);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
    // After registration, user needs to login
  }, []);

  const logout = useCallback(() => {
    // A07:2021 - Ensure cookie is properly removed with same options
    Cookies.remove('access_token', { path: '/' });
    setUser(null);
    // Clear any cached data
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      window.location.href = '/login';
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
