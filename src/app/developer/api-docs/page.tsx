'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestExample?: string;
  responseExample: string;
}

interface Section {
  name: string;
  endpoints: Endpoint[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-400',
  PATCH: 'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-rose-500/15 text-rose-400',
};

const sections: Section[] = [
  {
    name: 'Auth',
    endpoints: [
      {
        method: 'POST', path: '/api/v1/auth/register', description: 'Create a new user account',
        requestExample: '{\n  "email": "user@example.com",\n  "password": "securePassword123",\n  "name": "Jane Doe",\n  "company": "Acme Corp"\n}',
        responseExample: '{\n  "user_id": "usr_abc123",\n  "email": "user@example.com",\n  "name": "Jane Doe"\n}',
      },
      {
        method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate and receive an access token',
        requestExample: '{\n  "email": "user@example.com",\n  "password": "securePassword123"\n}',
        responseExample: '{\n  "access_token": "eyJhbGciOi...",\n  "user": {\n    "id": "usr_abc123",\n    "email": "user@example.com",\n    "name": "Jane Doe"\n  }\n}',
      },
    ],
  },
  {
    name: 'Datasets',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/datasets', description: 'List all datasets for the authenticated user',
        responseExample: '{\n  "datasets": [\n    {\n      "id": "ds_xyz",\n      "name": "training-data-v2",\n      "file_name": "data.csv",\n      "file_size": 1048576,\n      "row_count": 10000,\n      "status": "ready"\n    }\n  ],\n  "pagination": { "page": 1, "total": 1, "total_pages": 1 }\n}',
      },
      {
        method: 'POST', path: '/api/v1/datasets/upload', description: 'Get a pre-signed upload URL for a new dataset',
        requestExample: '{\n  "name": "training-data-v2",\n  "file_name": "data.csv",\n  "file_size": 1048576\n}',
        responseExample: '{\n  "upload_url": "https://storage.example.com/...",\n  "dataset_id": "ds_xyz"\n}',
      },
      {
        method: 'DELETE', path: '/api/v1/datasets/:id', description: 'Delete a dataset',
        responseExample: '{\n  "message": "Dataset deleted successfully"\n}',
      },
    ],
  },
  {
    name: 'Validations',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/validations', description: 'List all validations',
        responseExample: '{\n  "validations": [\n    {\n      "id": "val_abc",\n      "dataset_id": "ds_xyz",\n      "status": "completed",\n      "results": {\n        "risk_score": 12.5,\n        "dimensions": { ... }\n      }\n    }\n  ],\n  "pagination": { "page": 1, "total": 5, "total_pages": 1 }\n}',
      },
      {
        method: 'POST', path: '/api/v1/validations', description: 'Create a new validation run',
        requestExample: '{\n  "dataset_id": "ds_xyz",\n  "validation_type": "comprehensive",\n  "options": {\n    "model_size": "large",\n    "priority": "high"\n  }\n}',
        responseExample: '{\n  "id": "val_abc",\n  "dataset_id": "ds_xyz",\n  "status": "pending"\n}',
      },
      {
        method: 'GET', path: '/api/v1/validations/:id', description: 'Get validation details and results',
        responseExample: '{\n  "id": "val_abc",\n  "status": "completed",\n  "progress": 100,\n  "results": {\n    "risk_score": 12.5,\n    "collapse_probability": 0.08,\n    "dimensions": {\n      "distribution_fidelity": 92.3,\n      "feature_correlation": 88.1,\n      "temporal_consistency": 95.0,\n      "outlier_detection": 91.2,\n      "schema_compliance": 99.8\n    }\n  }\n}',
      },
    ],
  },
  {
    name: 'Warranties',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/warranties', description: 'List all warranties for the authenticated user',
        responseExample: '{\n  "warranties": [\n    {\n      "id": "war_def",\n      "validation_id": "val_abc",\n      "coverage_type": "standard",\n      "status": "active",\n      "risk_score": 12.5,\n      "coverage_amount": 50000,\n      "valid_until": "2027-01-01T00:00:00Z"\n    }\n  ]\n}',
      },
      {
        method: 'POST', path: '/api/v1/warranties', description: 'Purchase a warranty for a completed validation',
        requestExample: '{\n  "validation_id": "val_abc",\n  "coverage_type": "standard"\n}',
        responseExample: '{\n  "id": "war_def",\n  "status": "active",\n  "coverage_amount": 50000,\n  "premium_paid": 500\n}',
      },
    ],
  },
  {
    name: 'Credits',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/billing/credits', description: 'Get current credit balance',
        responseExample: '{\n  "balance": 4500,\n  "total_purchased": 10000,\n  "total_used": 5500\n}',
      },
      {
        method: 'POST', path: '/api/v1/billing/credits/purchase', description: 'Purchase additional credits',
        requestExample: '{\n  "amount": 5000,\n  "payment_method_id": "pm_abc"\n}',
        responseExample: '{\n  "transaction_id": "txn_xyz",\n  "credits_added": 5000,\n  "new_balance": 9500\n}',
      },
      {
        method: 'POST', path: '/api/v1/billing/promo', description: 'Redeem a promotional code',
        requestExample: '{\n  "code": "WELCOME50"\n}',
        responseExample: '{\n  "credits_added": 500,\n  "new_balance": 5000\n}',
      },
    ],
  },
  {
    name: 'Analytics',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/analytics/usage', description: 'Get usage analytics for the authenticated user',
        responseExample: '{\n  "total_rows_validated": 125000,\n  "total_datasets": 15,\n  "total_validations": 42,\n  "active_jobs": 2,\n  "avg_risk_score": 18.3,\n  "validations_this_month": 8,\n  "rows_this_month": 25000\n}',
      },
    ],
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-zinc-800/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3.5 hover:bg-zinc-900/20 transition-colors px-1 text-left"
      >
        {expanded ? <ChevronDown size={14} className="text-zinc-600 shrink-0" /> : <ChevronRight size={14} className="text-zinc-600 shrink-0" />}
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider w-16 justify-center shrink-0', methodColors[endpoint.method])}>
          {endpoint.method}
        </span>
        <span className="text-sm font-mono text-zinc-300">{endpoint.path}</span>
        <span className="text-sm text-zinc-600 ml-auto hidden sm:block">{endpoint.description}</span>
      </button>
      {expanded && (
        <div className="pl-9 pb-5 space-y-4">
          <p className="text-sm text-zinc-400 sm:hidden">{endpoint.description}</p>
          {endpoint.requestExample && (
            <div>
              <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-2">Request Body</p>
              <pre className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 text-sm text-zinc-300 font-mono overflow-x-auto">{endpoint.requestExample}</pre>
            </div>
          )}
          <div>
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-2">Response</p>
            <pre className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 text-sm text-zinc-300 font-mono overflow-x-auto">{endpoint.responseExample}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeveloperApiDocsPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">API Documentation</h1>
        <p className="text-sm text-zinc-500 mt-1">Complete reference for all Synthos API endpoints</p>
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.name}>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">{section.name}</p>
            <div className="border-t border-zinc-800/50">
              {section.endpoints.map((ep, i) => (
                <EndpointCard key={i} endpoint={ep} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
