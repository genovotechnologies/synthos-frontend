import apiClient from './client';
import type { UsageAnalytics } from './types';

export const analyticsApi = {
  getUsage: async (): Promise<UsageAnalytics> => {
    const response = await apiClient.get<UsageAnalytics>('/analytics/usage');
    return response.data;
  },
};
