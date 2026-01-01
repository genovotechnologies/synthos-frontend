import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from './types';

export interface UpdateProfileRequest {
  name?: string;
  company?: string;
  role?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  validation_complete: boolean;
  warranty_expiring: boolean;
  weekly_digest: boolean;
}

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
      return null;
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/auth/change-password', data);
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    try {
      const response = await apiClient.get<NotificationPreferences>('/auth/notifications/preferences');
      return response.data;
    } catch {
      return {
        email_notifications: true,
        validation_complete: true,
        warranty_expiring: true,
        weekly_digest: false,
      };
    }
  },

  updateNotificationPreferences: async (data: NotificationPreferences): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>('/auth/notifications/preferences', data);
    return response.data;
  },

  getApiKey: async (): Promise<{ api_key: string }> => {
    const response = await apiClient.get<{ api_key: string }>('/auth/api-key');
    return response.data;
  },

  regenerateApiKey: async (): Promise<{ api_key: string }> => {
    const response = await apiClient.post<{ api_key: string }>('/auth/api-key/regenerate');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};
