import apiClient from './client';
import type { Warranty, WarrantyListResponse } from './types';

export const warrantiesApi = {
  list: async (page = 1, perPage = 10): Promise<WarrantyListResponse> => {
    const response = await apiClient.get<WarrantyListResponse>('/warranties', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  get: async (id: string): Promise<Warranty> => {
    const response = await apiClient.get<Warranty>(`/warranties/${id}`);
    return response.data;
  },
};
