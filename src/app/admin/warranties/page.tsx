'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Shield, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  expired: 'bg-zinc-700/30 text-zinc-400',
  claimed: 'bg-rose-500/15 text-rose-400',
};

export default function AdminWarrantiesPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warranties', page],
    queryFn: () => adminApi.listAllWarranties(page, 20),
  });

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this warranty?')) return;
    try {
      await adminApi.approveWarranty(id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'warranties'] });
    } catch {
      alert('Failed to approve warranty.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await adminApi.rejectWarranty(id, reason);
      queryClient.invalidateQueries({ queryKey: ['admin', 'warranties'] });
    } catch {
      alert('Failed to reject warranty.');
    }
  };

  const warranties = data?.warranties || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-12">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} className="text-emerald-400" />
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Warranties</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">Review and manage data quality warranties</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-amber-500/80">
          <AlertCircle size={14} />
          <span>Failed to load warranties</span>
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
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
            <div className="col-span-3">Dataset</div>
            <div className="col-span-2">User</div>
            <div className="col-span-1 text-right">Risk</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Coverage</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table rows */}
          <div className="px-5">
            {warranties.map((warranty: any) => (
              <div
                key={warranty.id}
                className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 items-center"
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
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize',
                      statusStyles[warranty.status] || statusStyles.pending
                    )}
                  >
                    {warranty.status}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-zinc-400 text-right tabular-nums">
                  {warranty.coverage_amount != null
                    ? `$${(warranty.coverage_amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : '--'}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {warranty.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(warranty.id)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(warranty.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {warranty.status !== 'pending' && (
                    <span className="text-xs text-zinc-600">--</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Page {page} of {pagination.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
