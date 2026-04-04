import apiClient from './client';
import type { CreateValidationRequest, Validation, ValidationListResponse } from './types';

export const validationsApi = {
  list: async (page = 1, perPage = 10): Promise<ValidationListResponse> => {
    const response = await apiClient.get<ValidationListResponse>('/validations', {
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

  get: async (id: string): Promise<Validation> => {
    const response = await apiClient.get<Validation>(`/validations/${id}`);
    return response.data;
  },

  create: async (data: CreateValidationRequest): Promise<Validation> => {
    const response = await apiClient.post<Validation>('/validations/create', data);
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.post(`/validations/${id}/cancel`);
  },

  compare: async (id1: string, id2: string) => {
    const { data } = await apiClient.get(`/validations/compare?id1=${id1}&id2=${id2}`);
    return data;
  },
};
