'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warrantiesApi, type Warranty } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function WarrantyCard({ warranty, onClaim }: { warranty: Warranty; onClaim?: (w: Warranty) => void }) {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Active' },
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
    pending_review: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending Review' },
    approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Approved' },
    rejected: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Rejected' },
    expired: { icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-800', label: 'Expired' },
    claimed: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Claimed' },
  };

  const config = statusConfig[warranty.status as keyof typeof statusConfig] ?? statusConfig.pending;
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

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const diff = Math.ceil(
      (new Date(warranty.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaysRemaining(diff);
  }, [warranty.valid_until]);

  return (
    <div className="panel p-6">
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

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/[0.06]">
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Coverage</p>
          <p className="text-lg font-semibold text-zinc-100 mt-1 tabular-nums">{formatCurrency(warranty.coverage_amount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Risk Score</p>
          <p className={cn(
            "text-lg font-semibold mt-1 tabular-nums",
            (warranty.risk_score ?? 0) < 30 ? "text-emerald-400" :
            (warranty.risk_score ?? 0) < 60 ? "text-amber-400" : "text-rose-400"
          )}>
            {warranty.risk_score != null ? `${warranty.risk_score}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Premium Paid</p>
          <p className="font-medium text-zinc-300 mt-1 tabular-nums">{formatCurrency(warranty.premium_paid ?? 0)}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
            {warranty.status === 'active' ? 'Expires' : 'Expired'}
          </p>
          <p className="font-medium text-zinc-300 mt-1 tabular-nums">{formatDate(warranty.valid_until)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {warranty.status === 'active' && daysRemaining !== null && daysRemaining > 0 && (
          <p className="text-xs text-zinc-500">{daysRemaining} days remaining</p>
        )}
        {warranty.status === 'active' && onClaim && (
          <button
            onClick={() => onClaim(warranty)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/20 hover:bg-amber-500/[0.18] transition-all"
          >
            <FileWarning size={11} />
            File a claim
          </button>
        )}
        {warranty.status === 'expired' && (
          <p className="text-xs text-zinc-500">Coverage ended</p>
        )}
        {warranty.status === 'claimed' && (
          <p className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle size={11} />
            Claim filed — under review
          </p>
        )}
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
  const [claimTarget, setClaimTarget] = useState<Warranty | null>(null);

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
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Warranties</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your data quality warranties and coverage</p>
      </div>

      {/* Summary Stats — aggregated from the warranties on the current page only */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-10">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Active Warranties{totalPages > 1 ? ' (this page)' : ''}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{activeWarranties.length}</span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Coverage{totalPages > 1 ? ' (this page)' : ''}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">
                ${activeWarranties.reduce((sum, w) => sum + w.coverage_amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Avg Risk Score{totalPages > 1 ? ' (this page)' : ''}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">
                {activeWarranties.length
                  ? Math.round(activeWarranties.reduce((sum, w) => sum + (w.risk_score ?? 0), 0) / activeWarranties.length)
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
              "bg-violet-600 hover:bg-violet-500 text-white",
              "transition-colors duration-200"
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
                  <WarrantyCard key={warranty.id} warranty={warranty} onClaim={setClaimTarget} />
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

      {claimTarget && (
        <ClaimModal warranty={claimTarget} onClose={() => setClaimTarget(null)} />
      )}
    </div>
  );
}

function ClaimModal({ warranty, onClose }: { warranty: Warranty; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [claimType, setClaimType] = useState('performance_shortfall');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const maxAmount = warranty.coverage_amount;
  const parsedAmount = Number(amount);
  const amountInvalid =
    amount !== '' && (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > maxAmount);

  const claimMutation = useMutation({
    mutationFn: () =>
      warrantiesApi.claim(warranty.id, {
        claim_type: claimType,
        claim_amount: parsedAmount,
        description: description.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Claim filed', 'Our team will review your claim and follow up by email.');
      onClose();
    },
    onError: (err: Error) => {
      toast.error('Could not file claim', err.message || 'Please try again.');
    },
  });

  const canSubmit = !amountInvalid && amount !== '' && description.trim().length >= 20 && !claimMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={claimMutation.isPending ? undefined : onClose} />
      <div className="relative w-full max-w-md surface">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">File a warranty claim</h2>
            <p className="text-[13px] text-zinc-500 mt-0.5 truncate">{warranty.dataset_name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={claimMutation.isPending}
            aria-label="Close"
            className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="claim-type" className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Claim type
            </label>
            <select
              id="claim-type"
              value={claimType}
              onChange={(e) => setClaimType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="performance_shortfall">Model performance shortfall</option>
              <option value="collapse_event">Model collapse event</option>
              <option value="prediction_error">Prediction accuracy error</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="claim-amount" className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Claim amount (USD)
            </label>
            <input
              id="claim-amount"
              type="number"
              min={1}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Up to ${maxAmount.toLocaleString()}`}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-violet-500/50 tabular-nums"
            />
            {amountInvalid && (
              <p className="text-[11px] text-rose-400 mt-1">
                Enter an amount between $1 and ${maxAmount.toLocaleString()} (your coverage limit).
              </p>
            )}
          </div>

          <div>
            <label htmlFor="claim-description" className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              What happened?
            </label>
            <textarea
              id="claim-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the failure, the model affected, and how the validated data was used (min 20 characters)…"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-violet-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            disabled={claimMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => claimMutation.mutate()}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {claimMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit claim
          </button>
        </div>
      </div>
    </div>
  );
}
