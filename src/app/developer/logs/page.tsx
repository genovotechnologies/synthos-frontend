'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const levelBadge: Record<string, string> = {
  info: 'bg-blue-500/15 text-blue-400',
  warning: 'bg-amber-500/15 text-amber-400',
  error: 'bg-rose-500/15 text-rose-400',
};

export default function DeveloperLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['developer', 'logs', page],
    queryFn: () => developerApi.getLogs(page, 50),
    refetchInterval: 15000,
    retry: 1,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Logs</h1>
        <p className="text-sm text-zinc-500 mt-1">Recent API request logs. Auto-refreshes every 15 seconds.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50 overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50 min-w-[800px]">
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-1">Method</div>
            <div className="col-span-3">Path</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Message</div>
          </div>
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600">No logs found</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center min-w-[800px]">
                <div className="col-span-2">
                  <span className="text-sm text-zinc-500 tabular-nums font-mono">
                    {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', levelBadge[log.level] || levelBadge.info)}>
                    {log.level}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-zinc-400 font-mono">{log.method}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-sm text-zinc-300 font-mono truncate">{log.path}</span>
                </div>
                <div className="col-span-1">
                  <span className={cn(
                    'text-sm font-mono tabular-nums',
                    log.status_code >= 200 && log.status_code < 300 ? 'text-emerald-400' :
                    log.status_code >= 400 && log.status_code < 500 ? 'text-amber-400' :
                    'text-rose-400'
                  )}>
                    {log.status_code}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className="text-sm text-zinc-500 truncate">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pagination && pagination.total_count > 50 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-zinc-600">
            Page {pagination.page} of {Math.ceil(pagination.total_count / 50)}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(pagination.total_count / 50)}
              className="p-2 rounded-md border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
