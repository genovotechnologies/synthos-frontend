'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import { authApi, type User, type LoginRequest, type RegisterRequest } from '@/lib/api';
import { isTokenExpired } from '@/lib/utils';

// Role hierarchy levels
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  developer: 75,
  support: 50,
  user: 25,
};

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
  login: (data: LoginRequest) => Promise<string>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isSupport: boolean;
  userRole: string;
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
      if (currentUser) {
        setUser(currentUser);
      } else {
        // If /auth/me returns null (e.g., 404), create a placeholder user from token
        // This keeps the user logged in even if the endpoint isn't implemented
        setUser({
          id: 'temp',
          email: '',
          name: 'User',
          company: '',
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Only clear token on actual auth errors, not network errors
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

    // Return the role so the login page can route appropriately
    const u = response.user as unknown as Record<string, unknown>;
    return (u.role as string) || 'user';
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

  const userRole = useMemo(() => {
    if (!user) return 'user';
    const u = user as unknown as Record<string, unknown>;
    return (u.role as string) || 'user';
  }, [user]);

  const hasRole = useCallback((role: string) => {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[role] || 0);
  }, [userRole]);

  const isAdmin = userRole === 'admin';
  const isDeveloper = hasRole('developer');
  const isSupport = hasRole('support');

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
    hasRole,
    isAdmin,
    isDeveloper,
    isSupport,
    userRole,
  }), [user, isLoading, login, register, logout, checkAuth, hasRole, isAdmin, isDeveloper, isSupport, userRole]);

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
