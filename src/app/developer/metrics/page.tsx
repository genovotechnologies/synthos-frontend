'use client';

import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { Loader2 } from 'lucide-react';

export default function DeveloperMetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['developer', 'metrics'],
    queryFn: developerApi.getMetrics,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-800/50 rounded" />
          <div className="h-4 w-72 bg-zinc-800/30 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-x-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 bg-zinc-800/30 rounded" />
              <div className="h-8 w-24 bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Requests Today', value: (data?.total_requests_today ?? 0).toLocaleString() },
    { label: 'Error Count', value: (data?.error_count_today ?? 0).toLocaleString() },
    { label: 'Avg Latency', value: `${(data?.avg_latency_ms ?? 0).toFixed(0)}ms` },
  ];

  const endpointEntries = Object.entries(data?.requests_by_endpoint ?? {}).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Metrics</h1>
        <p className="text-sm text-zinc-500 mt-1">API usage metrics and performance data</p>
      </header>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-16 gap-y-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{stat.value}</span>
              <div className="h-px bg-zinc-800 mt-4" />
            </div>
          ))}
        </div>
      </section>

      {endpointEntries.length > 0 && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Requests by Endpoint</p>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <div className="space-y-3">
              {endpointEntries.map(([endpoint, count]) => (
                <div key={endpoint} className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-mono text-zinc-400">{endpoint}</span>
                  <span className="text-sm text-zinc-300 tabular-nums font-medium">{(count as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
