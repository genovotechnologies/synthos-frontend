import apiClient from './client';
import type { AdminUser, SystemOverview, PromoCode, Invite, Validation, Dataset, Pagination } from './types';

// Helper to map backend pagination (page_size/total_count) to frontend Pagination type (per_page/total)
function mapPagination(p: Partial<Pagination> & { page_size?: number; total_count?: number }): Pagination {
  return {
    page: p.page ?? 1,
    per_page: p.per_page || p.page_size || 20,
    total: p.total ?? p.total_count ?? 0,
    total_pages: p.total_pages ?? 1,
  };
}

// Audit events and platform settings come back with backend-defined keys; type
// the fields the UI reads and keep the rest open.
export interface AuditEvent {
  id?: string;
  [key: string]: unknown;
}

export interface AdminSettings {
  registration_enabled?: boolean;
  maintenance_mode?: boolean;
  max_upload_size_gb?: number;
  default_signup_credits?: number;
  allowed_email_domains?: string;
  [key: string]: unknown;
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
      // Backend may return validation_id instead of id; normalize like validationsApi does.
      validations: (data.validations || []).map((v: Validation & { validation_id?: string }) => ({
        ...v,
        id: v.id || v.validation_id,
      })),
      pagination: mapPagination(data.pagination || {}),
    };
  },
  listAllDatasets: async (page = 1, perPage = 20): Promise<{ datasets: Dataset[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/datasets?page=${page}&page_size=${perPage}`);
    return {
      datasets: (data.datasets || []).map((d: Dataset & { dataset_id?: string; filename?: string; rows?: number; columns?: number }) => ({
        ...d,
        id: d.id || d.dataset_id,
        name: d.name || d.filename || '',
        file_name: d.file_name || d.filename || '',
        row_count: d.row_count ?? d.rows ?? 0,
        column_count: d.column_count ?? d.columns ?? 0,
      })),
      pagination: mapPagination(data.pagination || {}),
    };
  },
  deleteUser: async (id: string, hard = false): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}${hard ? '?hard=true' : ''}`);
  },
  getAuditLog: async (page = 1, pageSize = 50): Promise<{ events: AuditEvent[]; pagination: Pagination }> => {
    const { data } = await apiClient.get(`/admin/audit-log?page=${page}&page_size=${pageSize}`);
    return data;
  },
  listAllWarranties: async (page = 1, pageSize = 20) => {
    const { data } = await apiClient.get(`/admin/warranties?page=${page}&page_size=${pageSize}`);
    // Backend returns warranty_id / warranty_type; normalize so approve/reject (which
    // use `.id`) and the UI work.
    if (Array.isArray(data?.warranties)) {
      data.warranties = data.warranties.map((w: Record<string, unknown>) => ({
        ...w,
        id: w.id ?? w.warranty_id,
        coverage_type: w.coverage_type ?? w.warranty_type,
      }));
    }
    return data;
  },
  approveWarranty: async (id: string) => {
    await apiClient.patch(`/admin/warranties/${id}/approve`);
  },
  rejectWarranty: async (id: string, reason: string) => {
    await apiClient.patch(`/admin/warranties/${id}/reject`, { reason });
  },
  getSettings: async (): Promise<AdminSettings> => {
    const { data } = await apiClient.get('/admin/settings');
    return data;
  },
  updateSettings: async (settings: Partial<AdminSettings>): Promise<AdminSettings> => {
    const { data } = await apiClient.patch('/admin/settings', settings);
    return data;
  },
};
