import apiClient from './client';
import type { CreateValidationRequest, Validation, ValidationListResponse } from './types';

// The backend returns `validation_id` (not `id`), a single `recommendation` string
// (not a `recommendations[]` array), and flat risk fields on list items. Normalize to
// the shape the UI expects so links, the cancel action, and risk display all work.
function normalizeValidation(raw: Record<string, unknown>): Validation {
  const out: Record<string, unknown> = { ...raw, id: raw.id ?? raw.validation_id };
  const results = raw.results as Record<string, unknown> | undefined;
  if (results) {
    out.results = {
      ...results,
      recommendations:
        results.recommendations ??
        (results.recommendation ? [results.recommendation as string] : undefined),
    };
  }
  return out as unknown as Validation;
}

export const validationsApi = {
  list: async (page = 1, perPage = 10): Promise<ValidationListResponse> => {
    const response = await apiClient.get<ValidationListResponse>('/validations', {
      params: { page, per_page: perPage },
    });
    const data = response.data as ValidationListResponse;
    data.validations = (data.validations || []).map((v) => normalizeValidation(v as unknown as Record<string, unknown>));
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

  get: async (id: string): Promise<Validation> => {
    const response = await apiClient.get<Validation>(`/validations/${id}`);
    return normalizeValidation(response.data as unknown as Record<string, unknown>);
  },

  create: async (data: CreateValidationRequest): Promise<Validation> => {
    const response = await apiClient.post<Validation>('/validations/create', data);
    return normalizeValidation(response.data as unknown as Record<string, unknown>);
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.post(`/validations/${id}/cancel`);
  },

  /** Rename a validation. Name rules: trimmed, 1-120 chars, non-empty. */
  rename: async (id: string, name: string): Promise<Validation> => {
    const response = await apiClient.patch<Validation>(`/validations/${id}`, { name: name.trim() });
    return normalizeValidation(response.data as unknown as Record<string, unknown>);
  },

  compare: async (id1: string, id2: string) => {
    const { data } = await apiClient.get(`/validations/compare?id1=${id1}&id2=${id2}`);
    return data;
  },
};
