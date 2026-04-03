'use client';

import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const statusColor: Record<string, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
};

const statusText: Record<string, { label: string; class: string }> = {
  healthy: { label: 'Healthy', class: 'text-emerald-400' },
  degraded: { label: 'Degraded', class: 'text-amber-400' },
  down: { label: 'Down', class: 'text-rose-400' },
};

export default function DeveloperServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['developer', 'services'],
    queryFn: developerApi.getServices,
    refetchInterval: 30000,
    retry: 1,
  });

  const services = data?.services ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Service Status</h1>
        <p className="text-sm text-zinc-500 mt-1">Real-time health monitoring across all platform services. Auto-refreshes every 30 seconds.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">No services found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const st = statusText[svc.status] || statusText.down;
            return (
              <div key={svc.name} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('w-3 h-3 rounded-full', statusColor[svc.status])} />
                  <span className={cn('text-sm font-medium', st.class)}>{st.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  {svc.latency_ms !== undefined && (
                    <span className="tabular-nums">{svc.latency_ms}ms latency</span>
                  )}
                  <span className="tabular-nums">
                    {new Date(svc.last_checked).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
