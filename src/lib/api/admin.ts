import apiClient from './client';
import type { AdminUser, SystemOverview, PromoCode, Invite, Validation, Dataset, Pagination } from './types';

// Helper to map backend pagination (page_size/total_count) to frontend Pagination type (per_page/total)
function mapPagination(p: any): Pagination {
  return {
    page: p.page,
    per_page: p.per_page || p.page_size || 20,
    total: p.total ?? p.total_count ?? 0,
    total_pages: p.total_pages,
  };
}

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
    return {
      users: data.users || [],
      pagination: mapPagination(data.pagination || {}),
    };
  },
  getUserDetail: async (id: string): Promise<AdminUser & { credit_balance?: number; validation_count?: number; dataset_count?: number }> => {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    // Backend wraps user in {user: {...}, credit_balance, ...} - flatten it
    if (data.user) {
      return { ...data.user, credit_balance: data.credit_balance, validation_count: data.validation_count, dataset_count: data.dataset_count };
    }
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
  deleteInvite: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/invites/${id}`);
  },
  listAllValidations: async (page = 1, perPage = 20): Promise<{ validations: Validation[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/validations?page=${page}&page_size=${perPage}`);
    return {
      validations: data.validations || [],
      pagination: mapPagination(data.pagination || {}),
    };
  },
  listAllDatasets: async (page = 1, perPage = 20): Promise<{ datasets: Dataset[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/datasets?page=${page}&page_size=${perPage}`);
    return {
      datasets: (data.datasets || []).map((d: any) => ({
        ...d,
        id: d.id || d.dataset_id,
        name: d.name || d.filename || '',
      })),
      pagination: mapPagination(data.pagination || {}),
    };
  },
  deleteUser: async (id: string, hard = false): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}${hard ? '?hard=true' : ''}`);
  },
  getAuditLog: async (page = 1, pageSize = 50): Promise<{ events: any[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/audit-log?page=${page}&page_size=${pageSize}`);
    return data;
  },
  listAllWarranties: async (page = 1, pageSize = 20) => {
    const { data } = await apiClient.get(`/admin/warranties?page=${page}&page_size=${pageSize}`);
    return data;
  },
  approveWarranty: async (id: string) => {
    await apiClient.patch(`/admin/warranties/${id}/approve`);
  },
  rejectWarranty: async (id: string, reason: string) => {
    await apiClient.patch(`/admin/warranties/${id}/reject`, { reason });
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
