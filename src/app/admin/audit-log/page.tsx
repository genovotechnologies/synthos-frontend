'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const actionBadgeClass: Record<string, string> = {
  role_change: 'bg-blue-500/15 text-blue-400',
  status_change: 'bg-amber-500/15 text-amber-400',
  user_delete: 'bg-rose-500/15 text-rose-400',
  promo_create: 'bg-emerald-500/15 text-emerald-400',
  settings_change: 'bg-violet-500/15 text-violet-400',
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
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
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Audit Log</h1>
          <p className="text-sm text-zinc-500 mt-1">Track all administrative actions on the platform</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
                <th className="py-3 pr-4 text-left">Time</th>
                <th className="py-3 pr-4 text-left">Admin</th>
                <th className="py-3 pr-4 text-left">Action</th>
                <th className="py-3 pr-4 text-left">Target</th>
                <th className="py-3 pr-4 text-left">Details</th>
                <th className="py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-600">No audit log entries found</td>
                </tr>
              ) : (
                events.map((event: any, idx: number) => (
                  <tr key={event.id || idx} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-400 tabular-nums whitespace-nowrap">
                        {new Date(event.timestamp || event.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-300">{event.admin_name || event.admin_email || '-'}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                        actionBadgeClass[event.action] || 'bg-zinc-800 text-zinc-400'
                      )}>
                        {(event.action || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-400">{event.target || event.target_email || '-'}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-500 truncate max-w-[200px] block">
                        {typeof event.details === 'object' ? JSON.stringify(event.details) : event.details || '-'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-zinc-600 font-mono">{event.ip_address || event.ip || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              className="p-2 rounded-md border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 rounded-md border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-700 text-right">
        Auto-refreshes every 30 seconds &middot; Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
