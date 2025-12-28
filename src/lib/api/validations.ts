import apiClient from './client';
import type { CreateValidationRequest, Validation, ValidationListResponse } from './types';

export const validationsApi = {
  list: async (page = 1, perPage = 10): Promise<ValidationListResponse> => {
    const response = await apiClient.get<ValidationListResponse>('/validations', {
      params: { page, per_page: perPage },
    });
    return response.data;
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
};
