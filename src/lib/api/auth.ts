import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from './types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch {
      // If endpoint doesn't exist (404) or unauthorized, return null
      // Don't throw error - let auth provider handle gracefully
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
