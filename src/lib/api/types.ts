// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  roles?: string[];
  is_active?: boolean;
  last_login_at?: string;
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
  invite_token?: string;
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
  status: 'uploading' | 'processing' | 'processed' | 'ready' | 'error';
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

// Multipart upload types for large files (up to 500GB)
export interface InitiateMultipartUploadResponse {
  dataset_id: string;
  upload_id: string;
  chunk_size: number; // Expected chunk size in bytes
}

export interface GetChunkUploadUrlRequest {
  upload_id: string;
  part_number: number;
}

export interface ChunkUploadUrlResponse {
  upload_url: string;
  part_number: number;
}

export interface UploadedPart {
  part_number: number;
  etag: string;
}

export interface CompleteMultipartUploadRequest {
  upload_id: string;
  parts: UploadedPart[];
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

// Admin types
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
  roles: string[];
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  credit_balance?: number;
  total_validations?: number;
  total_datasets?: number;
}

export interface SystemOverview {
  total_users: number;
  total_validations: number;
  total_datasets: number;
  total_revenue_cents: number;
  active_jobs: number;
  users_by_role: Record<string, number>;
}

export interface PromoCode {
  id: string;
  code: string;
  credits_grant: number;
  description: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

export interface Invite {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

// Support types
export interface SupportTicket {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportOverview {
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_response_time_hours: number;
}

// Developer types
export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms?: number;
  last_checked: string;
}

export interface DevOverview {
  services: ServiceStatus[];
  total_api_calls_today: number;
  error_rate_percent: number;
  avg_latency_ms: number;
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  auth_required: boolean;
  scopes?: string[];
}
