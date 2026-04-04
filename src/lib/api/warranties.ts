import apiClient from './client';
import type { Warranty, WarrantyListResponse } from './types';

export const warrantiesApi = {
  list: async (page = 1, perPage = 10): Promise<WarrantyListResponse> => {
    const response = await apiClient.get<WarrantyListResponse>('/warranties', {
      params: { page, per_page: perPage },
    });
    const data = response.data;
    // Map backend pagination (page_size/total_count) to frontend (per_page/total)
    if (data.pagination) {
      const p = data.pagination as any;
      data.pagination = {
        page: p.page,
        per_page: p.per_page || p.page_size || perPage,
        total: p.total ?? p.total_count ?? 0,
        total_pages: p.total_pages,
      };
    }
    return data;
  },

  get: async (id: string): Promise<Warranty> => {
    const response = await apiClient.get<Warranty>(`/warranties/${id}`);
    return response.data;
  },

  request: async (validationId: string, coverageType: string = 'performance'): Promise<Warranty> => {
    const { data } = await apiClient.post<Warranty>(`/warranties/${validationId}/request`, {
      coverage_type: coverageType,
    });
    return data;
  },
};
