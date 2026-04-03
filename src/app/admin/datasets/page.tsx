'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminDatasets() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'datasets', page],
    queryFn: () => adminApi.listAllDatasets(page, 20),
  });

  const totalPages = data?.pagination?.total_pages || 1;
  const statusColors: Record<string, string> = {
    uploading: 'text-amber-400 bg-amber-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    ready: 'text-emerald-400 bg-emerald-400/10',
    error: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">All Datasets</h1>
        <p className="text-sm text-zinc-500 mt-1">Cross-user dataset overview</p>
      </header>

      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-600" /></div>
        ) : !data?.datasets?.length ? (
          <p className="text-center text-zinc-500 py-16 text-sm">No datasets yet</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
              <div className="col-span-4">Dataset</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2 text-right">Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="px-5">
              {data.datasets.map((d) => (
                <div key={d.id} className="grid grid-cols-12 gap-4 py-3 border-b border-zinc-800/30 items-center text-sm">
                  <div className="col-span-4 flex items-center gap-2.5">
                    <FileText size={14} className="text-zinc-600 flex-shrink-0" />
                    <span className="text-zinc-300 truncate">{d.name || d.file_name || 'Untitled'}</span>
                  </div>
                  <div className="col-span-2 text-zinc-500 truncate text-xs">{(d as unknown as Record<string,unknown>).user_id ? String((d as unknown as Record<string,unknown>).user_id).slice(0, 12) : '—'}</div>
                  <div className="col-span-2 text-zinc-500 tabular-nums">{formatBytes(d.file_size)}</div>
                  <div className="col-span-2 text-right text-zinc-500 tabular-nums">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[d.status] || 'text-zinc-400 bg-zinc-800')}>
                      {d.status}
                    </span>
                  </div>
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
