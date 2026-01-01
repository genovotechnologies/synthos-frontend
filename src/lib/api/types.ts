// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  name: string;
}

// Dataset Types
export interface Dataset {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

export interface DatasetListResponse {
  datasets: Dataset[];
  pagination: Pagination;
}

export interface UploadUrlResponse {
  upload_url: string;
  dataset_id: string;
}

export interface CompleteUploadRequest {
  etag: string;
}

// Validation Types
export type ValidationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ValidationPriority = 'low' | 'normal' | 'high';
export type ModelSize = 'small' | 'medium' | 'large';

export interface ValidationOptions {
  model_size?: ModelSize;
  priority?: ValidationPriority;
}

export interface CreateValidationRequest {
  dataset_id: string;
  validation_type: string;
  options?: ValidationOptions;
}

export interface ValidationDimensions {
  distribution_fidelity: number;
  feature_correlation: number;
  temporal_consistency: number;
  outlier_detection: number;
  schema_compliance: number;
}

export interface ValidationResults {
  risk_score: number;
  dimensions: ValidationDimensions;
  collapse_probability: number;
  recommendations?: string[];
}

export interface Validation {
  id: string;
  dataset_id: string;
  dataset_name?: string;
  validation_type: string;
  status: ValidationStatus;
  progress?: number;
  options: ValidationOptions;
  results?: ValidationResults;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ValidationListResponse {
  validations: Validation[];
  pagination: Pagination;
}

// Warranty Types
export interface Warranty {
  id: string;
  validation_id: string;
  dataset_name: string;
  coverage_type: string;
  status: 'active' | 'expired' | 'claimed';
  risk_score: number;
  coverage_amount: number;
  premium_paid: number;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface WarrantyListResponse {
  warranties: Warranty[];
  pagination: Pagination;
}

// Analytics Types
export interface UsageAnalytics {
  total_rows_validated: number;
  total_datasets: number;
  total_validations: number;
  active_jobs: number;
  avg_risk_score: number;
  validations_this_month: number;
  rows_this_month: number;
}

// Common Types
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
