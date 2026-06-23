import apiClient from './client';
import type { Warranty, WarrantyListResponse } from './types';

// Backend returns warranty_id (not id), warranty_type (not coverage_type), and
// start_date/end_date (not valid_from/valid_until). Normalize for the UI.
function normalizeWarranty(raw: Record<string, unknown>): Warranty {
  return {
    ...raw,
    id: (raw.id ?? raw.warranty_id) as string,
    coverage_type: (raw.coverage_type ?? raw.warranty_type) as string,
    valid_from: (raw.valid_from ?? raw.start_date) as string,
    valid_until: (raw.valid_until ?? raw.end_date) as string,
  } as unknown as Warranty;
}

export const warrantiesApi = {
  list: async (page = 1, perPage = 10): Promise<WarrantyListResponse> => {
    const response = await apiClient.get<WarrantyListResponse>('/warranties', {
      params: { page, per_page: perPage },
    });
    const data = response.data as WarrantyListResponse;
    data.warranties = (data.warranties || []).map((w) =>
      normalizeWarranty(w as unknown as Record<string, unknown>)
    );
    // Map backend pagination (page_size/total_count) to frontend (per_page/total)
    if (data.pagination) {
      const p = data.pagination as unknown as Record<string, number>;
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
    return normalizeWarranty(response.data as unknown as Record<string, unknown>);
  },

  request: async (validationId: string, coverageType: string = 'standard'): Promise<Warranty> => {
    // Backend expects coverage_tier on the request body.
    const { data } = await apiClient.post<Warranty>(`/warranties/${validationId}/request`, {
      coverage_tier: coverageType,
    });
    return normalizeWarranty(data as unknown as Record<string, unknown>);
  },

  claim: async (
    warrantyId: string,
    claim: { claim_type: string; claim_amount: number; description: string }
  ): Promise<{ claim_id: string; status: string }> => {
    const { data } = await apiClient.post(`/warranties/${warrantyId}/claim`, claim);
    return data;
  },
};
