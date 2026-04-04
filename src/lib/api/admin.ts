import apiClient from './client';
import type { AdminUser, SystemOverview, PromoCode, Invite, Validation, Dataset, Pagination } from './types';

export const adminApi = {
  getOverview: async (): Promise<SystemOverview> => {
    const { data } = await apiClient.get('/admin/overview');
    return data;
  },
  listUsers: async (page = 1, perPage = 20, search?: string, role?: string, status?: string): Promise<{ users: AdminUser[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(perPage) });
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    const { data } = await apiClient.get(`/admin/users?${params}`);
    return data;
  },
  getUserDetail: async (id: string): Promise<AdminUser> => {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },
  updateUserRole: async (id: string, role: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/role`, { role });
  },
  updateUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/status`, { is_active: isActive });
  },
  listPromoCodes: async (): Promise<{ promo_codes: PromoCode[] }> => {
    const { data } = await apiClient.get('/admin/promo-codes');
    return data;
  },
  createPromoCode: async (code: string, creditsGrant: number, maxUses: number, description: string): Promise<PromoCode> => {
    const { data } = await apiClient.post('/admin/promo-codes', { code, credits_grant: creditsGrant, max_uses: maxUses, description });
    return data;
  },
  updatePromoCode: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/promo-codes/${id}`, { is_active: isActive });
  },
  createInvite: async (email: string, role: string): Promise<Invite> => {
    const { data } = await apiClient.post('/admin/invites', { email, role });
    return data;
  },
  listInvites: async (): Promise<{ invites: Invite[] }> => {
    const { data } = await apiClient.get('/admin/invites');
    return data;
  },
  listAllValidations: async (page = 1, perPage = 20): Promise<{ validations: Validation[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/validations?page=${page}&page_size=${perPage}`);
    return data;
  },
  listAllDatasets: async (page = 1, perPage = 20): Promise<{ datasets: Dataset[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/datasets?page=${page}&page_size=${perPage}`);
    return data;
  },
  deleteUser: async (id: string, hard = false): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}${hard ? '?hard=true' : ''}`);
  },
  getAuditLog: async (page = 1, pageSize = 50): Promise<{ events: any[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/audit-log?page=${page}&page_size=${pageSize}`);
    return data;
  },
  getSettings: async (): Promise<Record<string, any>> => {
    const { data } = await apiClient.get('/admin/settings');
    return data;
  },
  updateSettings: async (settings: Record<string, any>): Promise<Record<string, any>> => {
    const { data } = await apiClient.patch('/admin/settings', settings);
    return data;
  },
};
