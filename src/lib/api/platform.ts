import apiClient from './client';
import type { Dataset, Validation, Pagination } from './types';

/**
 * Forward-compatible API surface. These endpoints are being rolled out on the
 * backend; every call returns `null` when the endpoint does not exist yet
 * (404/405/501) so UI features can hide themselves until the backend lands.
 */

async function optional<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404 || status === 405 || status === 501) return null;
    // Network errors / 5xx also degrade to hidden rather than broken UI.
    if (!status || status >= 500) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Dataset groups — a folder upload validated as one logical dataset
// ---------------------------------------------------------------------------
export interface DatasetGroup {
  id: string;
  name: string;
  dataset_count: number;
  total_size_bytes: number;
  statuses?: Record<string, number>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Validation progress + row-level findings
// ---------------------------------------------------------------------------
export interface ValidationStage {
  key: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
}

export interface ValidationProgress {
  stage: string;
  percentage: number;
  eta_seconds?: number;
  stages: ValidationStage[];
}

export interface ValidationFinding {
  row_index: number;
  column?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  detail?: string;
  sample?: string;
}

export interface FindingsResponse {
  findings: ValidationFinding[];
  total: number;
  pagination?: Pagination;
}

// ---------------------------------------------------------------------------
// Dataset preview / schema
// ---------------------------------------------------------------------------
export interface DatasetColumn {
  name: string;
  type: string;
  null_pct?: number;
  unique_pct?: number;
  sample_values?: (string | number)[];
}

export interface DatasetPreview {
  columns: DatasetColumn[];
  rows?: Record<string, unknown>[];
  row_count?: number;
}

// ---------------------------------------------------------------------------
// Misc series / status types
// ---------------------------------------------------------------------------
export interface UsagePoint {
  date: string;
  spent: number;
  balance: number;
}

export interface GrowthPoint {
  date: string;
  signups?: number;
  validations?: number;
}

export interface CertificateVerification {
  valid: boolean;
  certificate_id: string;
  dataset_name?: string;
  validation_id?: string;
  risk_score?: number;
  issued_at?: string;
  expires_at?: string;
  issued_to?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export const platformApi = {
  // Dataset groups -----------------------------------------------------------
  listGroups: () =>
    optional(async () => {
      const { data } = await apiClient.get('/dataset-groups');
      return (data.groups ?? data ?? []) as DatasetGroup[];
    }),

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/dataset-groups/${id}`);
  },

  // Validation progress + findings -------------------------------------------
  getValidationProgress: (id: string) =>
    optional(async () => {
      const { data } = await apiClient.get<ValidationProgress>(`/validations/${id}/progress`);
      return data?.stages ? data : null;
    }),

  getValidationFindings: (id: string, page = 1, perPage = 25) =>
    optional(async () => {
      const { data } = await apiClient.get<FindingsResponse>(
        `/validations/${id}/findings?page=${page}&page_size=${perPage}`
      );
      return data?.findings ? data : null;
    }),

  // Dataset preview / schema ---------------------------------------------------
  getDatasetPreview: (id: string) =>
    optional(async () => {
      const { data } = await apiClient.get<DatasetPreview>(`/datasets/${id}/preview`);
      return Array.isArray(data?.columns) && data.columns.length > 0 ? data : null;
    }),

  // Dataset validation schedule -------------------------------------------------
  // Contract: a supporting backend returns 200 with {schedule: null} when unset,
  // so a 404 reliably means "endpoint not implemented" and the UI stays hidden.
  getDatasetSchedule: async (
    id: string
  ): Promise<{ supported: boolean; schedule: { cadence: string; validation_type?: string } | null }> => {
    try {
      const { data } = await apiClient.get(`/datasets/${id}/schedule`);
      const schedule = data?.schedule ?? (data?.cadence ? data : null);
      return { supported: true, schedule };
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404 || status === 405 || status === 501 || !status || status >= 500) {
        return { supported: false, schedule: null };
      }
      throw err;
    }
  },

  setDatasetSchedule: async (id: string, cadence: string, validationType = 'standard') => {
    const { data } = await apiClient.post(`/datasets/${id}/schedule`, {
      cadence,
      validation_type: validationType,
    });
    return data;
  },

  deleteDatasetSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}/schedule`);
  },

  // Credits usage series --------------------------------------------------------
  getUsageSeries: (period = '90d') =>
    optional(async () => {
      const { data } = await apiClient.get(`/credits/usage-series?period=${period}`);
      const points = (data.points ?? data) as UsagePoint[];
      return Array.isArray(points) && points.length > 0 ? points : null;
    }),

  // Admin growth (overview mini-chart) — merged from GET /admin/metrics.
  getAdminGrowth: (days = 30) =>
    optional(async () => {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const params = (metric: string) =>
        new URLSearchParams({ metric, from, to, granularity: 'day' }).toString();
      const [signupsRes, validationsRes] = await Promise.all([
        apiClient.get(`/admin/metrics?${params('signups')}`),
        apiClient.get(`/admin/metrics?${params('validations')}`),
      ]);
      const byDate = new Map<string, GrowthPoint>();
      for (const p of signupsRes.data.series ?? []) {
        const date = String(p.bucket).slice(0, 10);
        byDate.set(date, { date, signups: p.value, validations: 0 });
      }
      for (const p of validationsRes.data.series ?? []) {
        const date = String(p.bucket).slice(0, 10);
        const existing = byDate.get(date) ?? { date, signups: 0, validations: 0 };
        existing.validations = p.value;
        byDate.set(date, existing);
      }
      const points = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
      return points.length > 0 ? points : null;
    }),

  // Public certificate verification ---------------------------------------------
  verifyCertificate: (certificateId: string) =>
    optional(async () => {
      const { data } = await apiClient.get<CertificateVerification>(
        `/certificates/${encodeURIComponent(certificateId)}/verify`
      );
      return data ?? null;
    }),

  // Two-factor auth ---------------------------------------------------------------
  get2faStatus: () =>
    optional(async () => {
      const { data } = await apiClient.get<TwoFactorStatus>('/auth/2fa/status');
      return typeof data?.enabled === 'boolean' ? data : null;
    }),

  enroll2fa: async (): Promise<{ secret: string; otpauth_url: string }> => {
    const { data } = await apiClient.post('/auth/2fa/enroll');
    return data;
  },

  activate2fa: async (code: string): Promise<{ recovery_codes?: string[] }> => {
    const { data } = await apiClient.post('/auth/2fa/activate', { code });
    return data;
  },

  disable2fa: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { code });
  },
};

// ---------------------------------------------------------------------------
// Named API keys (endpoints exist today: GET/POST /api-keys, DELETE /api-keys/:id)
// ---------------------------------------------------------------------------
export interface ApiKeySummary {
  id: string;
  name?: string;
  key_prefix: string;
  created_at?: string;
  last_used_at?: string;
  scopes?: string[];
}

const DEFAULT_SCOPES = [
  'read:datasets', 'write:datasets', 'read:validations', 'write:validations',
  'read:analytics', 'read:warranties', 'write:warranties',
];

export const apiKeysApi = {
  list: async (): Promise<ApiKeySummary[]> => {
    const { data } = await apiClient.get('/api-keys');
    const keys = data?.api_keys || data || [];
    return Array.isArray(keys) ? keys : [];
  },

  /** Returns the full key exactly once — it cannot be retrieved again. */
  create: async (name: string): Promise<{ id: string; key: string; key_prefix: string }> => {
    const { data } = await apiClient.post('/api-keys', { name, scopes: DEFAULT_SCOPES });
    return data;
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient.delete(`/api-keys/${id}`);
  },
};

// Convenience: filter a validations list down to one dataset (until the backend
// supports ?dataset_id= filtering).
export function validationsForDataset(validations: Validation[], datasetId: string): Validation[] {
  return validations.filter((v) => v.dataset_id === datasetId);
}

export type { Dataset };
