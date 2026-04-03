import apiClient from './client';
import type { UsageAnalytics } from './types';

export const analyticsApi = {
  getUsage: async (): Promise<UsageAnalytics> => {
    const response = await apiClient.get('/analytics/usage');
    const d = response.data as Record<string, unknown>;
    // Map backend field names to frontend types
    return {
      total_rows_validated: (d.total_rows_validated ?? d.rows_validated ?? 0) as number,
      total_datasets: (d.total_datasets ?? d.datasets_uploaded ?? 0) as number,
      total_validations: (d.total_validations ?? d.validations_completed ?? 0) as number,
      active_jobs: (d.active_jobs ?? 0) as number,
      avg_risk_score: (d.avg_risk_score ?? d.average_risk_score ?? 0) as number,
      validations_this_month: (d.validations_this_month ?? (d.usage as Record<string, unknown>)?.validations_this_period ?? 0) as number,
      rows_this_month: (d.rows_this_month ?? 0) as number,
    };
  },
};
