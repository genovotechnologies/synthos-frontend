'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Lock,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Key,
  Database,
  ShieldCheck,
  Award,
  Coins,
  LifeBuoy,
  Zap,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  request?: string;
  response: string;
  curl?: string;
}

interface EndpointGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  endpoints: Endpoint[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

const BASE_URL = 'https://api.synthos.dev';

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    id: 'authentication',
    title: 'Authentication',
    icon: Key,
    description: 'Register, login, and manage user accounts. All authenticated endpoints require a Bearer token.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/register',
        description: 'Create a new Synthos account. An OTP code will be sent to the provided email for verification.',
        auth: false,
        request: `{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secureP@ss123",
  "company": "Acme AI",
  "role": "ML Engineer"
}`,
        response: `{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "usr_abc123",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "email_verified": false
  }
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "secureP@ss123",
    "company": "Acme AI",
    "role": "ML Engineer"
  }'`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Authenticate and receive a JWT access token. The token is valid for 24 hours.',
        auth: false,
        request: `{
  "email": "jane@example.com",
  "password": "secureP@ss123"
}`,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_abc123",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "email_verified": true
  }
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "jane@example.com", "password": "secureP@ss123"}'`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/verify-email',
        description: 'Verify your email address using the OTP code sent during registration.',
        auth: false,
        request: `{
  "email": "jane@example.com",
  "otp": "482901"
}`,
        response: `{
  "message": "Email verified successfully.",
  "user": {
    "id": "usr_abc123",
    "email_verified": true
  }
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/verify-email \\
  -H "Content-Type: application/json" \\
  -d '{"email": "jane@example.com", "otp": "482901"}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/me',
        description: 'Retrieve the currently authenticated user profile.',
        auth: true,
        response: `{
  "id": "usr_abc123",
  "email": "jane@example.com",
  "name": "Jane Doe",
  "company": "Acme AI",
  "role": "ML Engineer",
  "email_verified": true,
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'PATCH',
        path: '/api/v1/auth/me',
        description: 'Update the current user profile fields (name, company, role).',
        auth: true,
        request: `{
  "name": "Jane Smith",
  "company": "Acme AI Labs"
}`,
        response: `{
  "id": "usr_abc123",
  "name": "Jane Smith",
  "company": "Acme AI Labs",
  "role": "ML Engineer"
}`,
        curl: `curl -X PATCH ${BASE_URL}/api/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Jane Smith", "company": "Acme AI Labs"}'`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/change-password',
        description: 'Change the password for the authenticated user.',
        auth: true,
        request: `{
  "current_password": "secureP@ss123",
  "new_password": "newSecureP@ss456"
}`,
        response: `{
  "message": "Password changed successfully."
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/change-password \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"current_password": "secureP@ss123", "new_password": "newSecureP@ss456"}'`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/forgot-password',
        description: 'Request a password reset link. An email with a reset token will be sent.',
        auth: false,
        request: `{
  "email": "jane@example.com"
}`,
        response: `{
  "message": "If an account with that email exists, a reset link has been sent."
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email": "jane@example.com"}'`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/reset-password',
        description: 'Reset password using the token received via email.',
        auth: false,
        request: `{
  "token": "rst_token_xyz",
  "new_password": "brandNewP@ss789"
}`,
        response: `{
  "message": "Password reset successfully."
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{"token": "rst_token_xyz", "new_password": "brandNewP@ss789"}'`,
      },
    ],
  },
  {
    id: 'datasets',
    title: 'Datasets',
    icon: Database,
    description: 'Upload, manage, and inspect training datasets. Uploads use signed URLs for secure, direct-to-storage transfers.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/datasets/upload',
        description: 'Initiate a dataset upload. Returns a signed URL for direct upload to cloud storage.',
        auth: true,
        request: `{
  "name": "gpt4-training-v2",
  "file_name": "training_data.jsonl",
  "file_size": 52428800,
  "file_type": "application/jsonl"
}`,
        response: `{
  "dataset_id": "ds_xyz789",
  "upload_url": "https://storage.googleapis.com/synthos-uploads/...",
  "expires_at": "2025-01-15T11:30:00Z"
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/datasets/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "gpt4-training-v2", "file_name": "training_data.jsonl", "file_size": 52428800, "file_type": "application/jsonl"}'`,
      },
      {
        method: 'POST',
        path: '/api/v1/datasets/:id/complete',
        description: 'Mark a dataset upload as complete after uploading to the signed URL. Triggers processing.',
        auth: true,
        request: `{
  "checksum": "sha256:abc123..."
}`,
        response: `{
  "id": "ds_xyz789",
  "name": "gpt4-training-v2",
  "status": "processing",
  "rows": 150000,
  "size_bytes": 52428800
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/datasets/ds_xyz789/complete \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"checksum": "sha256:abc123..."}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/datasets',
        description: 'List all datasets for the authenticated user. Supports pagination via page and per_page query parameters.',
        auth: true,
        response: `{
  "datasets": [
    {
      "id": "ds_xyz789",
      "name": "gpt4-training-v2",
      "status": "ready",
      "rows": 150000,
      "size_bytes": 52428800,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}`,
        curl: `curl "${BASE_URL}/api/v1/datasets?page=1&per_page=20" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/datasets/:id',
        description: 'Retrieve detailed information about a specific dataset.',
        auth: true,
        response: `{
  "id": "ds_xyz789",
  "name": "gpt4-training-v2",
  "status": "ready",
  "rows": 150000,
  "size_bytes": 52428800,
  "file_type": "application/jsonl",
  "columns": ["prompt", "completion", "metadata"],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:35:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/datasets/ds_xyz789 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'DELETE',
        path: '/api/v1/datasets/:id',
        description: 'Delete a dataset and its associated storage. This action is irreversible.',
        auth: true,
        response: `{
  "message": "Dataset deleted successfully."
}`,
        curl: `curl -X DELETE ${BASE_URL}/api/v1/datasets/ds_xyz789 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
  {
    id: 'validations',
    title: 'Validations',
    icon: ShieldCheck,
    description: 'Create and monitor validation jobs. Validations analyze datasets for model collapse risk, quality issues, and training outcome prediction.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/validations/create',
        description: 'Create a new validation job for a dataset. Costs credits based on dataset size and validation type.',
        auth: true,
        request: `{
  "dataset_id": "ds_xyz789",
  "validation_type": "comprehensive",
  "config": {
    "collapse_detection": true,
    "quality_analysis": true,
    "training_prediction": true
  }
}`,
        response: `{
  "id": "val_abc456",
  "dataset_id": "ds_xyz789",
  "dataset_name": "gpt4-training-v2",
  "validation_type": "comprehensive",
  "status": "pending",
  "credits_charged": 50,
  "estimated_completion": "2025-01-17T10:30:00Z",
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/validations/create \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"dataset_id": "ds_xyz789", "validation_type": "comprehensive"}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/validations',
        description: 'List all validation jobs. Supports pagination and filtering by status.',
        auth: true,
        response: `{
  "validations": [
    {
      "id": "val_abc456",
      "dataset_name": "gpt4-training-v2",
      "validation_type": "comprehensive",
      "status": "completed",
      "results": {
        "risk_score": 12,
        "quality_score": 94,
        "collapse_detected": false
      },
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}`,
        curl: `curl "${BASE_URL}/api/v1/validations?page=1&status=completed" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/validations/:id',
        description: 'Get detailed results for a specific validation, including risk analysis and recommendations.',
        auth: true,
        response: `{
  "id": "val_abc456",
  "dataset_id": "ds_xyz789",
  "dataset_name": "gpt4-training-v2",
  "validation_type": "comprehensive",
  "status": "completed",
  "results": {
    "risk_score": 12,
    "quality_score": 94,
    "collapse_detected": false,
    "collapse_signatures": [],
    "recommendations": [
      "Dataset quality is excellent for training.",
      "Consider augmenting samples in category 'edge_cases'."
    ],
    "row_analysis": {
      "total_rows": 150000,
      "flagged_rows": 342,
      "problematic_categories": ["duplicates", "low_quality"]
    }
  },
  "credits_charged": 50,
  "started_at": "2025-01-15T10:31:00Z",
  "completed_at": "2025-01-17T08:15:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/validations/val_abc456 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/validations/:id/report',
        description: 'Download the full validation report as a PDF document.',
        auth: true,
        response: `Binary PDF file (Content-Type: application/pdf)`,
        curl: `curl ${BASE_URL}/api/v1/validations/val_abc456/report \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -o validation_report.pdf`,
      },
    ],
  },
  {
    id: 'warranties',
    title: 'Warranties',
    icon: Award,
    description: 'Request and manage performance warranties on validated datasets. Warranties provide financial backing for prediction accuracy.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/warranties/:validation_id/request',
        description: 'Request a performance warranty for a completed validation. Only available for validations with risk_score below 25.',
        auth: true,
        request: `{
  "warranty_type": "standard",
  "coverage_amount": 50000
}`,
        response: `{
  "id": "war_def789",
  "validation_id": "val_abc456",
  "warranty_type": "standard",
  "status": "active",
  "coverage_amount": 50000,
  "accuracy_threshold": 90,
  "expires_at": "2025-07-15T10:30:00Z",
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/warranties/val_abc456/request \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"warranty_type": "standard", "coverage_amount": 50000}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/warranties',
        description: 'List all warranties for the authenticated user.',
        auth: true,
        response: `{
  "warranties": [
    {
      "id": "war_def789",
      "validation_id": "val_abc456",
      "warranty_type": "standard",
      "status": "active",
      "coverage_amount": 50000,
      "expires_at": "2025-07-15T10:30:00Z"
    }
  ],
  "total": 1
}`,
        curl: `curl ${BASE_URL}/api/v1/warranties \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/warranties/:id',
        description: 'Get detailed information about a specific warranty, including claim status.',
        auth: true,
        response: `{
  "id": "war_def789",
  "validation_id": "val_abc456",
  "dataset_name": "gpt4-training-v2",
  "warranty_type": "standard",
  "status": "active",
  "coverage_amount": 50000,
  "accuracy_threshold": 90,
  "claim_filed": false,
  "expires_at": "2025-07-15T10:30:00Z",
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/warranties/war_def789 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    icon: Coins,
    description: 'Manage your credit balance, purchase credits, and view transaction history. Credits are consumed when running validations.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/credits/balance',
        description: 'Get the current credit balance for the authenticated user.',
        auth: true,
        response: `{
  "balance": 500,
  "currency": "credits",
  "last_updated": "2025-01-15T10:30:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/credits/balance \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/credits/packages',
        description: 'List available credit packages for purchase.',
        auth: false,
        response: `{
  "packages": [
    {
      "id": "pkg_starter",
      "name": "Starter",
      "credits": 100,
      "price_usd": 49.00,
      "popular": false
    },
    {
      "id": "pkg_pro",
      "name": "Professional",
      "credits": 500,
      "price_usd": 199.00,
      "popular": true
    },
    {
      "id": "pkg_enterprise",
      "name": "Enterprise",
      "credits": 2000,
      "price_usd": 649.00,
      "popular": false
    }
  ]
}`,
        curl: `curl ${BASE_URL}/api/v1/credits/packages`,
      },
      {
        method: 'POST',
        path: '/api/v1/credits/purchase',
        description: 'Purchase a credit package. Returns a checkout URL for payment processing via Paddle.',
        auth: true,
        request: `{
  "package_id": "pkg_pro"
}`,
        response: `{
  "checkout_url": "https://checkout.paddle.com/...",
  "transaction_id": "txn_abc123",
  "credits": 500,
  "amount_usd": 199.00
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/credits/purchase \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"package_id": "pkg_pro"}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/credits/history',
        description: 'View credit transaction history including purchases, usage, and refunds.',
        auth: true,
        response: `{
  "transactions": [
    {
      "id": "txn_abc123",
      "type": "purchase",
      "amount": 500,
      "description": "Professional package",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "txn_def456",
      "type": "debit",
      "amount": -50,
      "description": "Validation: gpt4-training-v2",
      "created_at": "2025-01-15T11:00:00Z"
    }
  ],
  "total": 2,
  "page": 1
}`,
        curl: `curl "${BASE_URL}/api/v1/credits/history?page=1" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'POST',
        path: '/api/v1/credits/redeem',
        description: 'Redeem a promotional code for bonus credits.',
        auth: true,
        request: `{
  "code": "WELCOME50"
}`,
        response: `{
  "message": "Promo code redeemed successfully.",
  "credits_added": 50,
  "new_balance": 550
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/credits/redeem \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"code": "WELCOME50"}'`,
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    icon: LifeBuoy,
    description: 'Create and manage support tickets. Our team typically responds within 4 business hours.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/tickets',
        description: 'Create a new support ticket.',
        auth: true,
        request: `{
  "subject": "Validation stuck in processing",
  "message": "My validation val_abc456 has been processing for over 72 hours.",
  "priority": "high",
  "category": "validation"
}`,
        response: `{
  "id": "tkt_ghi012",
  "subject": "Validation stuck in processing",
  "status": "open",
  "priority": "high",
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/tickets \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "Validation stuck in processing", "message": "My validation val_abc456 has been processing for over 72 hours.", "priority": "high", "category": "validation"}'`,
      },
      {
        method: 'GET',
        path: '/api/v1/tickets',
        description: 'List all support tickets for the authenticated user.',
        auth: true,
        response: `{
  "tickets": [
    {
      "id": "tkt_ghi012",
      "subject": "Validation stuck in processing",
      "status": "open",
      "priority": "high",
      "last_reply_at": "2025-01-15T12:00:00Z",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}`,
        curl: `curl ${BASE_URL}/api/v1/tickets \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/v1/tickets/:id',
        description: 'Get a specific ticket with its full conversation thread.',
        auth: true,
        response: `{
  "id": "tkt_ghi012",
  "subject": "Validation stuck in processing",
  "status": "open",
  "priority": "high",
  "messages": [
    {
      "id": "msg_001",
      "sender": "user",
      "message": "My validation val_abc456 has been processing for over 72 hours.",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "msg_002",
      "sender": "support",
      "message": "We are looking into this. The job was stuck due to a node failure and has been requeued.",
      "created_at": "2025-01-15T12:00:00Z"
    }
  ],
  "created_at": "2025-01-15T10:30:00Z"
}`,
        curl: `curl ${BASE_URL}/api/v1/tickets/tkt_ghi012 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'POST',
        path: '/api/v1/tickets/:id/reply',
        description: 'Reply to an existing support ticket.',
        auth: true,
        request: `{
  "message": "Thank you, the validation is now running again."
}`,
        response: `{
  "id": "msg_003",
  "ticket_id": "tkt_ghi012",
  "sender": "user",
  "message": "Thank you, the validation is now running again.",
  "created_at": "2025-01-15T14:00:00Z"
}`,
        curl: `curl -X POST ${BASE_URL}/api/v1/tickets/tkt_ghi012/reply \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Thank you, the validation is now running again."}'`,
      },
    ],
  },
];

const RATE_LIMITS = [
  { tier: 'Free', requests: '60 / min', burst: '10 / sec', notes: 'Default for new accounts' },
  { tier: 'Pro', requests: '300 / min', burst: '30 / sec', notes: 'Purchased credit package' },
  { tier: 'Enterprise', requests: '1,000 / min', burst: '100 / sec', notes: 'Custom agreement' },
];

const CREDIT_COSTS = [
  { operation: 'Quick Scan', credits: '10', description: 'Basic quality check and row count verification' },
  { operation: 'Standard Validation', credits: '25', description: 'Collapse detection + quality scoring' },
  { operation: 'Comprehensive Validation', credits: '50', description: 'Full cascade validation with training prediction' },
  { operation: 'Warranty Request', credits: '100', description: 'Performance warranty issuance' },
];

const ERROR_CODES = [
  { code: '400', name: 'Bad Request', description: 'The request body is invalid or missing required fields.' },
  { code: '401', name: 'Unauthorized', description: 'Missing or invalid authentication token.' },
  { code: '403', name: 'Forbidden', description: 'You do not have permission to access this resource.' },
  { code: '404', name: 'Not Found', description: 'The requested resource does not exist.' },
  { code: '409', name: 'Conflict', description: 'A resource with the same identifier already exists.' },
  { code: '422', name: 'Unprocessable Entity', description: 'The request was well-formed but contains semantic errors.' },
  { code: '429', name: 'Too Many Requests', description: 'Rate limit exceeded. Retry after the Retry-After header value.' },
  { code: '500', name: 'Internal Server Error', description: 'An unexpected error occurred on our end.' },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wide border ${METHOD_COLORS[method]}`}>
      {method}
    </span>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800/50 rounded-lg bg-zinc-900/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-zinc-800/20 transition-colors"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm text-zinc-200 font-mono flex-1">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Lock className="w-3 h-3" />
            Auth
          </span>
        )}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-800/30">
          <p className="text-sm text-zinc-400 pt-4">{endpoint.description}</p>

          {endpoint.request && (
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Request Body</p>
              <div className="relative">
                <pre className="bg-zinc-950 rounded-lg p-4 text-sm text-zinc-300 font-mono overflow-x-auto border border-zinc-800/50">
                  {endpoint.request}
                </pre>
                <CopyButton text={endpoint.request} />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Response</p>
            <div className="relative">
              <pre className="bg-zinc-950 rounded-lg p-4 text-sm text-emerald-300/80 font-mono overflow-x-auto border border-zinc-800/50">
                {endpoint.response}
              </pre>
              <CopyButton text={endpoint.response} />
            </div>
          </div>

          {endpoint.curl && (
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">cURL Example</p>
              <div className="relative">
                <pre className="bg-zinc-950 rounded-lg p-4 text-sm text-blue-300/80 font-mono overflow-x-auto border border-zinc-800/50 whitespace-pre-wrap break-all">
                  {endpoint.curl}
                </pre>
                <CopyButton text={endpoint.curl} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiDocsPage() {
  const sidebarSections = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    ...ENDPOINT_GROUPS.map((g) => ({ id: g.id, label: g.title, icon: g.icon })),
    { id: 'rate-limits', label: 'Rate Limits', icon: Zap },
    { id: 'credit-costs', label: 'Credit Costs', icon: Coins },
    { id: 'errors', label: 'Error Codes', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#0a0a0b]/95 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <SynthosLogo size={28} />
              <span className="text-lg font-semibold text-white">Synthos</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <h1 className="text-sm font-medium text-zinc-300">API Reference</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/20">
              v1
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto border-r border-zinc-800/40 bg-zinc-900/20">
          <nav className="py-6 px-4 space-y-1">
            {sidebarSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
              >
                <section.icon className="w-4 h-4 flex-shrink-0" />
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10 space-y-16">
          {/* Getting Started */}
          <section id="getting-started">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Getting Started</h2>
            </div>

            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-zinc-400 leading-relaxed">
                The Synthos API lets you integrate AI training data validation directly into your ML pipeline.
                All API requests are made to <code className="text-violet-400 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">https://api.synthos.dev</code> and
                must include the appropriate headers.
              </p>

              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Authentication Flow</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Create an account</strong> by calling{' '}
                    <code className="text-blue-400">POST /api/v1/auth/register</code> with your email and password.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Verify your email</strong> using the OTP code sent to your inbox via{' '}
                    <code className="text-blue-400">POST /api/v1/auth/verify-email</code>.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Get your token</strong> by calling{' '}
                    <code className="text-blue-400">POST /api/v1/auth/login</code>. This returns a JWT valid for 24 hours.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Include the token</strong> in all authenticated requests using the{' '}
                    <code className="text-violet-400">Authorization: Bearer YOUR_TOKEN</code> header.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Base URL</h3>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-4 text-sm font-mono text-zinc-300 border border-zinc-800/50">
                    https://api.synthos.dev/api/v1/
                  </pre>
                  <CopyButton text="https://api.synthos.dev/api/v1/" />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white">Request Headers</h3>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-4 text-sm font-mono text-zinc-300 border border-zinc-800/50">{`Content-Type: application/json
Authorization: Bearer YOUR_TOKEN`}</pre>
                  <CopyButton text={`Content-Type: application/json\nAuthorization: Bearer YOUR_TOKEN`} />
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-400">API Key Authentication</h3>
                </div>
                <p className="text-sm text-zinc-400">
                  For server-to-server integrations, you can also authenticate using an API key. Generate one from your{' '}
                  <Link href="/dashboard/settings" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                    dashboard settings
                  </Link>
                  . Pass it as <code className="text-violet-400 bg-zinc-900 px-1 py-0.5 rounded text-xs">X-API-Key: sk_live_...</code> header.
                </p>
              </div>
            </div>
          </section>

          {/* Endpoint Groups */}
          {ENDPOINT_GROUPS.map((group) => (
            <section key={group.id} id={group.id}>
              <div className="flex items-center gap-3 mb-2">
                <group.icon className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold text-white">{group.title}</h2>
              </div>
              <p className="text-sm text-zinc-500 mb-6">{group.description}</p>
              <div className="space-y-3">
                {group.endpoints.map((endpoint, idx) => (
                  <EndpointCard key={idx} endpoint={endpoint} />
                ))}
              </div>
            </section>
          ))}

          {/* Rate Limits */}
          <section id="rate-limits">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Rate Limits</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              Rate limits are applied per API key / token. Exceeding the limit returns a 429 status with a Retry-After header.
            </p>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tier</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Burst</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {RATE_LIMITS.map((rl) => (
                    <tr key={rl.tier} className="border-b border-zinc-800/30 last:border-0">
                      <td className="px-5 py-3 font-medium text-zinc-200">{rl.tier}</td>
                      <td className="px-5 py-3 text-zinc-400 font-mono">{rl.requests}</td>
                      <td className="px-5 py-3 text-zinc-400 font-mono">{rl.burst}</td>
                      <td className="px-5 py-3 text-zinc-500">{rl.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Credit Costs */}
          <section id="credit-costs">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-6 h-6 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Credit Costs</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              Each operation consumes credits from your balance. Purchase credits from the dashboard or via the API.
            </p>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Operation</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Credits</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CREDIT_COSTS.map((cc) => (
                    <tr key={cc.operation} className="border-b border-zinc-800/30 last:border-0">
                      <td className="px-5 py-3 font-medium text-zinc-200">{cc.operation}</td>
                      <td className="px-5 py-3 text-violet-400 font-mono font-bold">{cc.credits}</td>
                      <td className="px-5 py-3 text-zinc-500">{cc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Error Codes */}
          <section id="errors">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Error Codes</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              All errors return a JSON body with a <code className="text-violet-400 bg-zinc-900 px-1 py-0.5 rounded text-xs">message</code> field
              describing the issue.
            </p>

            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 mb-6">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Error Response Format</p>
              <div className="relative">
                <pre className="bg-zinc-950 rounded-lg p-4 text-sm text-rose-300/80 font-mono border border-zinc-800/50">{`{
  "error": {
    "code": 422,
    "message": "Validation failed: dataset_id is required.",
    "request_id": "req_abc123"
  }
}`}</pre>
                <CopyButton text={`{\n  "error": {\n    "code": 422,\n    "message": "Validation failed: dataset_id is required.",\n    "request_id": "req_abc123"\n  }\n}`} />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Code</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ERROR_CODES.map((ec) => (
                    <tr key={ec.code} className="border-b border-zinc-800/30 last:border-0">
                      <td className="px-5 py-3 font-mono font-bold text-rose-400">{ec.code}</td>
                      <td className="px-5 py-3 font-medium text-zinc-200">{ec.name}</td>
                      <td className="px-5 py-3 text-zinc-500">{ec.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-sm text-zinc-600">
              Need help?{' '}
              <Link href="/support" className="text-violet-400 hover:text-violet-300 transition-colors">
                Contact support
              </Link>
              {' '}&middot;{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
