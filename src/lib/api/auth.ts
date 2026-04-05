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
  ticket_updates: boolean;
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
    // Handle both flat response and wrapped {user: {...}} response
    let user = response.data;
    if ((user as any).user) {
      user = (user as any).user;
    }
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
      const response = await apiClient.get<NotificationPreferences>('/auth/notification-preferences');
      return response.data;
    } catch {
      return { email_notifications: true, validation_complete: true, warranty_expiring: true, weekly_digest: false, ticket_updates: true };
    }
  },

  updateNotificationPreferences: async (data: NotificationPreferences): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>('/auth/notification-preferences', data);
    return response.data;
  },

  getApiKey: async (): Promise<{ api_key: string }> => {
    // Backend uses /api-keys (list). Return the first key if available.
    try {
      const response = await apiClient.get('/api-keys');
      const keys = response.data?.api_keys || response.data || [];
      if (Array.isArray(keys) && keys.length > 0) {
        return { api_key: keys[0].key_prefix + '...' };
      }
      return { api_key: '' };
    } catch {
      return { api_key: '' };
    }
  },

  regenerateApiKey: async (): Promise<{ api_key: string }> => {
    // Delete existing keys first
    try {
      const response = await apiClient.get('/api-keys');
      const keys = response.data?.api_keys || response.data || [];
      if (Array.isArray(keys)) {
        for (const key of keys) {
          await apiClient.delete(`/api-keys/${key.id}`);
        }
      }
    } catch {
      // Ignore deletion errors; proceed to create new key
    }
    // Create new key with default scopes
    const response = await apiClient.post<{ id: string; key: string; key_prefix: string }>('/api-keys', {
      name: 'Default API Key',
      scopes: ['read:datasets', 'write:datasets', 'read:validations', 'write:validations', 'read:analytics', 'read:warranties', 'write:warranties'],
    });
    return { api_key: response.data.key || response.data.key_prefix + '...' };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};
