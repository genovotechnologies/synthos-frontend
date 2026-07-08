'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const actionBadgeClass: Record<string, string> = {
  role_change: 'bg-blue-500/15 text-blue-400',
  status_change: 'bg-amber-500/15 text-amber-400',
  user_delete: 'bg-rose-500/15 text-rose-400',
  promo_create: 'bg-emerald-500/15 text-emerald-400',
  settings_change: 'bg-violet-500/15 text-violet-400',
};

// Tolerant reads for audit events — backends vary in field naming. Keep in sync
// with the identical helper in src/app/admin/page.tsx.
function readAuditEvent(event: Record<string, unknown>) {
  return {
    action: String(event.action || event.event_type || event.description || ''),
    actor: String(event.admin_name || event.admin_email || event.user_email || event.actor || ''),
    time: (event.timestamp || event.created_at) as string | undefined,
    target: String(event.target || event.target_email || ''),
    ip: String(event.ip_address || event.ip || ''),
    details: event.details,
  };
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () => adminApi.getAuditLog(page, pageSize),
    retry: 1,
    refetchInterval: 30000,
  });

  const events = data?.events ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Audit Log</h1>
          <p className="text-sm text-zinc-500 mt-1">Track all administrative actions on the platform</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 border border-white/[0.06] rounded-lg hover:border-zinc-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : isError ? (
        <div className="panel p-8 text-center">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 mb-1">Failed to load audit log</p>
          <p className="text-xs text-zinc-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="py-3 pl-5 pr-4 text-left">Time</th>
                  <th className="py-3 pr-4 text-left">Admin</th>
                  <th className="py-3 pr-4 text-left">Action</th>
                  <th className="py-3 pr-4 text-left">Target</th>
                  <th className="py-3 pr-4 text-left">Details</th>
                  <th className="py-3 pr-5 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-zinc-600">No audit log entries found</td>
                  </tr>
                ) : (
                  events.map((event, idx: number) => {
                    const { action, actor, time, target, ip, details } = readAuditEvent(event);
                    return (
                      <tr key={event.id || idx} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-5 pr-4">
                          <span className="text-sm text-zinc-400 tabular-nums whitespace-nowrap">
                            {time
                              ? new Date(time).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-zinc-300">{actor || '-'}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                            actionBadgeClass[action] || 'bg-zinc-800 text-zinc-400'
                          )}>
                            {action.replace(/_/g, ' ') || '-'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-zinc-400">{target || '-'}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-zinc-500 truncate max-w-[200px] block">
                            {typeof details === 'object' && details !== null ? JSON.stringify(details) : String(details ?? '') || '-'}
                          </span>
                        </td>
                        <td className="py-3 pr-5">
                          <span className="text-sm text-zinc-600 font-mono">{ip || '-'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-zinc-600">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total} events)
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

      <p className="text-xs text-zinc-700 text-right">
        Auto-refreshes every 30 seconds
        {dataUpdatedAt > 0 && <> &middot; Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}</>}
      </p>
    </div>
  );
}
