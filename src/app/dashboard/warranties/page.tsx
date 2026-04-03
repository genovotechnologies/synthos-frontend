'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { warrantiesApi, type Warranty } from '@/lib/api';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function WarrantyCard({ warranty }: { warranty: Warranty }) {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Active' },
    expired: { icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-800', label: 'Expired' },
    claimed: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Claimed' },
  };

  const config = statusConfig[warranty.status];
  const StatusIcon = config.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysRemaining = Math.ceil(
    (new Date(warranty.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", config.bg)}>
            <Shield size={18} className={config.color} />
          </div>
          <div>
            <p className="font-medium text-zinc-200 text-sm">{warranty.dataset_name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{warranty.coverage_type}</p>
          </div>
        </div>
        <span className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
          config.bg,
          config.color
        )}>
          <StatusIcon size={12} />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Coverage</p>
          <p className="text-lg font-semibold text-zinc-100 mt-1 tabular-nums">{formatCurrency(warranty.coverage_amount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Risk Score</p>
          <p className={cn(
            "text-lg font-semibold mt-1 tabular-nums",
            warranty.risk_score < 30 ? "text-emerald-400" :
            warranty.risk_score < 60 ? "text-amber-400" : "text-rose-400"
          )}>
            {warranty.risk_score}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Premium Paid</p>
          <p className="font-medium text-zinc-300 mt-1 tabular-nums">{formatCurrency(warranty.premium_paid)}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
            {warranty.status === 'active' ? 'Expires' : 'Expired'}
          </p>
          <p className="font-medium text-zinc-300 mt-1 tabular-nums">{formatDate(warranty.valid_until)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {warranty.status === 'active' && daysRemaining > 0 && (
          <p className="text-xs text-zinc-500">{daysRemaining} days remaining</p>
        )}
        {warranty.status === 'expired' && (
          <p className="text-xs text-zinc-500">Coverage ended</p>
        )}
        {warranty.status === 'claimed' && <div />}
        <Link
          href={`/dashboard/validations/${warranty.validation_id}`}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          View validation
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}

export default function WarrantiesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['warranties', page],
    queryFn: () => warrantiesApi.list(page, 12),
  });

  const activeWarranties = data?.warranties?.filter(w => w.status === 'active') || [];
  const otherWarranties = data?.warranties?.filter(w => w.status !== 'active') || [];
  const totalPages = data?.pagination?.total_pages || 1;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Warranties</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your data quality warranties and coverage</p>
      </div>

      {/* Summary Stats */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-10">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Active Warranties</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{activeWarranties.length}</span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Total Coverage</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">
                ${activeWarranties.reduce((sum, w) => sum + w.coverage_amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Avg Risk Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">
                {activeWarranties.length
                  ? Math.round(activeWarranties.reduce((sum, w) => sum + w.risk_score, 0) / activeWarranties.length)
                  : 0}%
              </span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-amber-500/80">
          <AlertTriangle size={14} />
          <span>Failed to load warranties</span>
        </div>
      ) : !data?.warranties?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-1">No warranties yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm">
            Complete a validation to get warranty coverage for your datasets
          </p>
          <Link
            href="/dashboard/validations"
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
              "hover:from-violet-500 hover:to-violet-400",
              "transition-all duration-200"
            )}
          >
            Create Validation
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {activeWarranties.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle size={12} className="text-emerald-400" />
                Active Coverage ({activeWarranties.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWarranties.map((warranty) => (
                  <WarrantyCard key={warranty.id} warranty={warranty} />
                ))}
              </div>
            </div>
          )}

          {otherWarranties.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">
                Past Warranties ({otherWarranties.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherWarranties.map((warranty) => (
                  <WarrantyCard key={warranty.id} warranty={warranty} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
