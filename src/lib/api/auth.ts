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
    // Check if email verification is required
    const raw = result as unknown as Record<string, unknown>;
    if (raw.requires_verification) {
      const error = new Error('EMAIL_VERIFICATION_REQUIRED');
      (error as any).email = raw.email;
      throw error;
    }
    // Map backend field names to frontend types
    if (result.user) {
      const u = result.user as unknown as Record<string, unknown>;
      if (u.full_name && !u.name) result.user.name = u.full_name as string;
      if (u.company_name && !u.company) result.user.company = u.company_name as string;
    }
    return result;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const body: Record<string, string | undefined> = {
      email: data.email,
      password: data.password,
      full_name: data.name,
      company_name: data.company || '',
    };
    if (data.invite_token) {
      body.invite_token = data.invite_token;
    }
    const response = await apiClient.post<RegisterResponse>('/auth/register', body);
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
    // Backend does not have a dedicated notification preferences endpoint.
    // Return defaults so the UI renders without crashing.
    console.warn('getNotificationPreferences: endpoint not available, returning defaults');
    return {
      email_notifications: true,
      validation_complete: true,
      warranty_expiring: true,
      weekly_digest: false,
    };
  },

  updateNotificationPreferences: async (data: NotificationPreferences): Promise<NotificationPreferences> => {
    // Backend does not have a dedicated notification preferences endpoint.
    console.warn('updateNotificationPreferences: endpoint not available, returning input');
    return data;
  },

  getApiKey: async (): Promise<{ api_key: string }> => {
    // Backend uses /api-keys (list). Return the first key if available.
    try {
      const response = await apiClient.get<{ api_keys: { id: string; key: string }[] }>('/api-keys');
      const keys = response.data.api_keys;
      if (keys && keys.length > 0) {
        return { api_key: keys[0].key };
      }
      return { api_key: '' };
    } catch {
      return { api_key: '' };
    }
  },

  regenerateApiKey: async (): Promise<{ api_key: string }> => {
    // Backend uses DELETE /api-keys/:id + POST /api-keys to regenerate.
    try {
      // First, list existing keys to delete the old one
      const listResponse = await apiClient.get<{ api_keys: { id: string; key: string }[] }>('/api-keys');
      const keys = listResponse.data.api_keys;
      if (keys && keys.length > 0) {
        await apiClient.delete(`/api-keys/${keys[0].id}`);
      }
    } catch {
      // Ignore deletion errors; proceed to create new key
    }
    // Create a new API key
    const response = await apiClient.post<{ id: string; key: string }>('/api-keys');
    return { api_key: response.data.key };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};
