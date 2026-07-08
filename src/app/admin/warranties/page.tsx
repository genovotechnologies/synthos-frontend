'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import { Shield, Loader2, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  pending_review: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-400',
  expired: 'bg-zinc-700/30 text-zinc-400',
  claimed: 'bg-rose-500/15 text-rose-400',
};

// Warranty statuses that still need an approve/reject decision.
const REVIEWABLE_STATUSES = ['pending', 'pending_review'];

// coverage_amount comes from the backend in cents; divide by 100 for display.
function formatUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

interface AdminWarranty {
  id: string;
  dataset_name?: string;
  user_email?: string;
  user_id?: string;
  risk_score?: number;
  status: string;
  coverage_amount?: number | null;
}

export default function AdminWarrantiesPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject'; datasetName: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'warranties', page],
    queryFn: () => adminApi.listAllWarranties(page, 20),
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveWarranty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warranties'] });
      setConfirmAction(null);
      toast.success('Warranty approved');
    },
    onError: (err: Error) => toast.error('Failed to approve warranty', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectWarranty(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warranties'] });
      setConfirmAction(null);
      toast.success('Warranty rejected');
    },
    onError: (err: Error) => toast.error('Failed to reject warranty', err.message),
  });

  const actionsPending = approveMutation.isPending || rejectMutation.isPending;

  const warranties: AdminWarranty[] = data?.warranties || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-12">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} className="text-emerald-400" />
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Warranties</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">Review and manage data quality warranties</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : isError ? (
        <div className="panel p-8 text-center">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 mb-1">Failed to load warranties</p>
          <p className="text-xs text-zinc-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : warranties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-1">No warranties yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Warranties will appear here when users request them after validations.
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
                <div className="col-span-3">Dataset</div>
                <div className="col-span-2">User</div>
                <div className="col-span-1 text-right">Risk</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-right">Coverage</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table rows */}
              <div className="px-5">
                {warranties.map((warranty) => (
                  <div
                    key={warranty.id}
                    className="grid grid-cols-12 gap-4 py-3.5 border-b border-white/[0.04] last:border-b-0 items-center"
                  >
                    <div className="col-span-3 text-sm text-zinc-300 truncate">
                      {warranty.dataset_name || 'Unknown dataset'}
                    </div>
                    <div className="col-span-2 text-sm text-zinc-500 truncate">
                      {warranty.user_email || warranty.user_id}
                    </div>
                    <div className="col-span-1 text-sm text-zinc-400 text-right tabular-nums">
                      {warranty.risk_score ?? '--'}%
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize whitespace-nowrap',
                          statusStyles[warranty.status] || statusStyles.pending
                        )}
                      >
                        {String(warranty.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-zinc-400 text-right tabular-nums">
                      {warranty.coverage_amount != null ? formatUSD(warranty.coverage_amount) : '--'}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {REVIEWABLE_STATUSES.includes(warranty.status) ? (
                        <>
                          <button
                            onClick={() => setConfirmAction({ id: warranty.id, action: 'approve', datasetName: warranty.dataset_name || 'this warranty' })}
                            disabled={actionsPending}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ id: warranty.id, action: 'reject', datasetName: warranty.dataset_name || 'this warranty' })}
                            disabled={actionsPending}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-600">--</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-zinc-600">
            Page {pagination.page ?? page} of {pagination.total_pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-md border border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 rounded-md border border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Approve confirmation */}
      <ConfirmDialog
        open={confirmAction?.action === 'approve'}
        title="Approve warranty"
        description={confirmAction ? `Approve the warranty for "${confirmAction.datasetName}"? Coverage becomes active immediately.` : undefined}
        confirmLabel="Approve"
        loading={approveMutation.isPending}
        onConfirm={() => { if (confirmAction) approveMutation.mutate(confirmAction.id); }}
        onClose={() => setConfirmAction(null)}
      />

      {/* Reject confirmation with required reason */}
      <ConfirmDialog
        open={confirmAction?.action === 'reject'}
        title="Reject warranty"
        description={confirmAction ? `Reject the warranty for "${confirmAction.datasetName}". The user will see the reason you provide.` : undefined}
        confirmLabel="Reject"
        variant="danger"
        requireReason
        reasonPlaceholder="Enter rejection reason…"
        loading={rejectMutation.isPending}
        onConfirm={(reason) => { if (confirmAction && reason) rejectMutation.mutate({ id: confirmAction.id, reason }); }}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
