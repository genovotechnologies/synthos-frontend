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
    const result = response.data;
    // Map backend field names to frontend types
    if (result.user) {
      const u = result.user as unknown as Record<string, unknown>;
      if (u.full_name && !u.name) result.user.name = u.full_name as string;
      if (u.company_name && !u.company) result.user.company = u.company_name as string;
    }
    return result;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.name,
      company_name: data.company || '',
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get<User>('/auth/me');
      const user = response.data;
      // Map backend field names to frontend types
      const u = user as unknown as Record<string, unknown>;
      if (u.full_name && !u.name) user.name = u.full_name as string;
      if (u.company_name && !u.company) user.company = u.company_name as string;
      return user;
    } catch {
      return null;
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', {
      full_name: data.name,
      company_name: data.company,
      job_title: data.role,
    });
    const user = response.data;
    const u = user as unknown as Record<string, unknown>;
    if (u.full_name && !u.name) user.name = u.full_name as string;
    if (u.company_name && !u.company) user.company = u.company_name as string;
    return user;
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
