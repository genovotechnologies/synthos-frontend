import apiClient from './client';
import type { DevOverview, ServiceStatus } from './types';

export const developerApi = {
  getOverview: async (): Promise<DevOverview> => {
    const { data } = await apiClient.get('/developer/overview');
    return data;
  },
  getServices: async (): Promise<{ services: ServiceStatus[] | Record<string, unknown> }> => {
    const { data } = await apiClient.get('/developer/services');
    return data;
  },
  getApiDocs: async (): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.get('/developer/api-docs');
    return data;
  },
  getLogs: async (page = 1, perPage = 50): Promise<{ logs: Array<{ id: string; level: string; message: string; path: string; method: string; status_code: number; created_at: string }>; pagination: { page: number; total_count: number } }> => {
    const { data } = await apiClient.get(`/developer/logs?page=${page}&per_page=${perPage}`);
    return data;
  },
  getMetrics: async (): Promise<{ total_requests_today: number; error_count_today: number; avg_latency_ms: number; requests_by_endpoint: Record<string, number> }> => {
    const { data } = await apiClient.get('/developer/metrics');
    return data;
  },
};
