'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500', queued: 'bg-amber-500',
    processing: 'bg-blue-500 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors[status] || 'bg-zinc-500')} />;
}

export default function AdminValidations() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'validations', page],
    queryFn: () => adminApi.listAllValidations(page, 20),
  });

  const totalPages = data?.pagination?.total_pages || 1;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">All Validations</h1>
        <p className="text-sm text-zinc-500 mt-1">Cross-user validation history</p>
      </header>

      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-600" /></div>
        ) : !data?.validations?.length ? (
          <p className="text-center text-zinc-500 py-16 text-sm">No validations yet</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
              <div className="col-span-3">Dataset</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Risk</div>
              <div className="col-span-2 text-right">Date</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            <div className="px-5">
              {data.validations.map((v) => (
                <div key={v.id} className="grid grid-cols-12 gap-4 py-3 border-b border-zinc-800/30 items-center text-sm">
                  <div className="col-span-3 text-zinc-300 truncate">{v.dataset_name || v.dataset_id || 'Untitled'}</div>
                  <div className="col-span-2 text-zinc-500 truncate text-xs">{((v as unknown as Record<string,string>).user_id || '—').slice(0, 12)}</div>
                  <div className="col-span-2 text-zinc-500">{v.validation_type || '—'}</div>
                  <div className="col-span-2 text-right text-zinc-400 tabular-nums">{v.results?.risk_score != null ? `${v.results.risk_score}%` : '—'}</div>
                  <div className="col-span-2 text-right text-zinc-500 tabular-nums">{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="col-span-1 flex justify-end items-center gap-1.5"><StatusDot status={v.status} /><span className="text-zinc-500 capitalize text-xs">{v.status}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
