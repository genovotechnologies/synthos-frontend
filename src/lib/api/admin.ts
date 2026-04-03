import apiClient from './client';
import type { AdminUser, SystemOverview, PromoCode, Invite, Validation, Dataset, Pagination } from './types';

export const adminApi = {
  getOverview: async (): Promise<SystemOverview> => {
    const { data } = await apiClient.get('/admin/overview');
    return data;
  },
  listUsers: async (page = 1, perPage = 20, search?: string, role?: string, status?: string): Promise<{ users: AdminUser[]; pagination: Pagination }> => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
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
    const { data } = await apiClient.get(`/admin/validations?page=${page}&per_page=${perPage}`);
    return data;
  },
  listAllDatasets: async (page = 1, perPage = 20): Promise<{ datasets: Dataset[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/datasets?page=${page}&per_page=${perPage}`);
    return data;
  },
};
