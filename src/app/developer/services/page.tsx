'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { developerApi } from '@/lib/api/developer';
import type { ServiceStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Loader2, ScrollText, Server, AlertTriangle, RotateCcw, Clock, Zap } from 'lucide-react';

const statusColor: Record<string, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
};

const statusRing: Record<string, string> = {
  healthy: 'ring-emerald-500/30',
  degraded: 'ring-amber-500/30',
  down: 'ring-rose-500/30',
};

const statusTextMap: Record<string, { label: string; cls: string }> = {
  healthy: { label: 'Healthy', cls: 'text-emerald-400' },
  degraded: { label: 'Degraded', cls: 'text-amber-400' },
  down: { label: 'Down', cls: 'text-rose-400' },
};

// Static documentation about what each service does — keyed by a normalized
// (lowercase, separator-stripped) service name so lookups survive whatever
// casing/underscores the backend uses ("api_gateway", "API Gateway", "Api Gateway").
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  apigateway: 'Routes and authenticates all incoming API requests',
  mlbackend: 'GPU-accelerated validation engine on GKE',
  joborchestrator: 'Manages validation job queues and scheduling',
  dataservice: 'Handles dataset upload, storage, and retrieval',
  database: 'PostgreSQL primary database cluster',
  redis: 'In-memory cache and session store',
};

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, '');
}

function serviceDescription(name: string): string {
  return SERVICE_DESCRIPTIONS[normalizeKey(name)] ?? 'Platform service';
}

export default function DeveloperServicesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['developer', 'services'],
    queryFn: developerApi.getServices,
    refetchInterval: 30000,
    retry: 1,
  });

  const rawServices = data?.services ?? {};
  const services = Array.isArray(rawServices)
    ? rawServices
    : (Object.entries(rawServices).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        ...(value as Record<string, unknown>),
      })) as ServiceStatus[]);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Service Status</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Health checks across all platform services. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : isError ? (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <p className="text-sm text-zinc-300 mb-1">Failed to load service status</p>
          <p className="text-xs text-zinc-600 mb-5">The status endpoint did not respond. Try again in a moment.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-10 text-center">
          <p className="text-sm text-zinc-600">No services reported by the status endpoint.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const st = statusTextMap[svc.status] || statusTextMap.down;
            return (
              <div
                key={svc.name}
                className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 flex flex-col gap-5 hover:border-zinc-700/50 transition-colors"
              >
                {/* Header: icon + name + status dot */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Server size={18} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{svc.name}</p>
                      <p className={cn('text-[11px] font-medium', st.cls)}>{st.label}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'mt-1 w-3 h-3 rounded-full ring-4 ring-offset-2 ring-offset-[#0a0a0b] shrink-0',
                      statusColor[svc.status] || statusColor.down,
                      statusRing[svc.status] || statusRing.down
                    )}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 leading-relaxed">{serviceDescription(svc.name)}</p>

                {/* Real telemetry: latency + last checked */}
                <div className="grid grid-cols-2 gap-3 border-t border-zinc-800/50 pt-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
                      <Zap size={10} /> Latency
                    </p>
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">
                      {svc.latency_ms !== undefined ? `${svc.latency_ms}ms` : '—'}
                    </span>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
                      <Clock size={10} /> Last checked
                    </p>
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">
                      {svc.last_checked
                        ? new Date(svc.last_checked).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <Link
                  href="/developer/logs"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
                >
                  <ScrollText size={12} />
                  View Logs
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
