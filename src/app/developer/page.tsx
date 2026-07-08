'use client';

import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BookOpen, Terminal, ScrollText, BarChart3, Activity, Server,
  AlertTriangle, Clock, ExternalLink
} from 'lucide-react';

const statusColor: Record<string, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
};

const statusLabel: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
};

function Skeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-800/50 rounded" />
        <div className="h-4 w-72 bg-zinc-800/30 rounded" />
      </div>
      {/* Service health grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-zinc-800/30 rounded-xl" />
        ))}
      </div>
      {/* Metrics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />
        ))}
      </div>
      {/* Errors card */}
      <div className="h-40 bg-zinc-800/30 rounded-xl" />
      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function InlineLoadError({ label }: { label: string }) {
  return (
    <div className="bg-zinc-900/30 border border-rose-500/20 rounded-xl p-4 flex items-center gap-2.5">
      <AlertTriangle size={14} className="text-rose-400 shrink-0" />
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

const ERROR_LOG_WINDOW = 50;

export default function DeveloperOverviewPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data, isLoading, isError: overviewError } = useQuery({
    queryKey: ['developer', 'overview'],
    queryFn: developerApi.getOverview,
    retry: 1,
    refetchInterval: 15000,
  });

  const { data: metricsData, isError: metricsError } = useQuery({
    queryKey: ['developer', 'metrics'],
    queryFn: developerApi.getMetrics,
    retry: 1,
    refetchInterval: 15000,
  });

  const { data: logsData, isError: logsError } = useQuery({
    queryKey: ['developer', 'logs', 'recent-errors'],
    queryFn: () => developerApi.getLogs(1, ERROR_LOG_WINDOW),
    retry: 1,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Services come from a separate endpoint, not the overview
  const { data: servicesData, isError: servicesError } = useQuery({
    queryKey: ['developer', 'services'],
    queryFn: developerApi.getServices,
    retry: 1,
    refetchInterval: 15000,
  });

  if (isLoading) return <Skeleton />;

  const rawServices = servicesData?.services ?? {};
  const services = Array.isArray(rawServices)
    ? rawServices
    : Object.entries(rawServices).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        ...(value as Record<string, unknown>),
      })) as { name: string; status: string; latency_ms?: number; last_checked: string }[];

  const fetchedLogs = logsData?.logs ?? [];
  const recentErrors = fetchedLogs.filter(
    (log) => log.status_code >= 400 || log.level === 'error'
  );
  const displayedErrors = recentErrors.slice(0, 10);

  const metrics = [
    {
      label: 'API Requests (today)',
      value: (metricsData?.total_requests_today ?? 0).toLocaleString(),
      icon: BarChart3,
      failed: metricsError,
    },
    {
      label: 'Errors (24h)',
      value: (data?.recent_errors_24h ?? metricsData?.error_count_today ?? 0).toLocaleString(),
      icon: AlertTriangle,
      warn: (data?.recent_errors_24h ?? 0) > 10,
      failed: overviewError && metricsError,
    },
    {
      label: 'Avg Latency',
      value: `${(metricsData?.avg_latency_ms ?? 0).toFixed(0)}ms`,
      icon: Clock,
      failed: metricsError,
    },
    {
      label: 'Validations Today',
      value: (data?.validations_today ?? 0).toLocaleString(),
      icon: Activity,
      failed: overviewError,
    },
  ];

  const quickActions = [
    { name: 'View API Docs', href: '/developer/api-docs', icon: BookOpen, color: 'text-blue-400' },
    { name: 'Open Playground', href: '/developer/playground', icon: Terminal, color: 'text-emerald-400' },
    { name: 'View Logs', href: '/developer/logs', icon: ScrollText, color: 'text-amber-400' },
    { name: 'Check Metrics', href: '/developer/metrics', icon: BarChart3, color: 'text-violet-400' },
    { name: 'Service Status', href: '/developer/services', icon: Server, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Developer Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Service health, API metrics, and quick access</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Auto-refresh every 15s
          <span className="text-zinc-700 ml-1 tabular-nums">
            {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Service Health Grid */}
      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Service Health</p>
        {servicesError ? (
          <InlineLoadError label="Failed to load service health. Retrying automatically every 15 seconds." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5 hover:border-zinc-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-zinc-200">{svc.name}</span>
                  <span className={cn('w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-[#0a0a0b]',
                    statusColor[svc.status] || statusColor.down,
                    svc.status === 'healthy' ? 'ring-emerald-500/30' : svc.status === 'degraded' ? 'ring-amber-500/30' : 'ring-rose-500/30'
                  )} />
                </div>
                <div className="space-y-2">
                  <span className={cn(
                    'text-xs font-medium',
                    svc.status === 'healthy' ? 'text-emerald-400' : svc.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                  )}>
                    {statusLabel[svc.status] || 'Unknown'}
                  </span>
                  <div className="flex items-center justify-between">
                    {svc.latency_ms !== undefined && (
                      <span className="text-xs text-zinc-600 tabular-nums">{svc.latency_ms}ms</span>
                    )}
                    <span className="text-[10px] text-zinc-700 tabular-nums">
                      {new Date(svc.last_checked).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <Link
                  href="/developer/logs"
                  className="mt-3 flex items-center gap-1 text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors"
                >
                  View Logs <ExternalLink size={10} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Real-time Metrics Strip */}
      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Real-time Metrics</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} className="text-blue-400" />
                  <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</p>
                </div>
                {metric.failed ? (
                  <span className="text-xs text-rose-400/80">Failed to load</span>
                ) : (
                  <span className={cn(
                    'text-2xl font-semibold tabular-nums tracking-tight',
                    metric.warn ? 'text-amber-400' : 'text-zinc-100'
                  )}>
                    {metric.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Errors in the most recent log window */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Errors in last {Math.min(fetchedLogs.length, ERROR_LOG_WINDOW) || ERROR_LOG_WINDOW} requests
            {!logsError && (
              <span className="ml-2 text-zinc-600 normal-case tracking-normal tabular-nums">
                {recentErrors.length} matched
              </span>
            )}
          </p>
          <Link href="/developer/logs" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            View all logs
          </Link>
        </div>
        {logsError ? (
          <InlineLoadError label="Failed to load recent logs. Retrying automatically every 15 seconds." />
        ) : recentErrors.length === 0 ? (
          <div className="panel p-6 text-center">
            <p className="text-sm text-zinc-600">
              No errors in the last {Math.min(fetchedLogs.length, ERROR_LOG_WINDOW) || ERROR_LOG_WINDOW} requests.
            </p>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-4 py-2.5">Time</th>
                    <th className="text-left text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-4 py-2.5">Endpoint</th>
                    <th className="text-left text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-4 py-2.5">Method</th>
                    <th className="text-right text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-4 py-2.5">Code</th>
                    <th className="text-left text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-4 py-2.5">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedErrors.map((err) => (
                    <tr key={err.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-2.5 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                        {new Date(err.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-300 font-mono">{err.path}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-zinc-500">{err.method}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          err.status_code >= 500 ? 'text-rose-400' : 'text-amber-400'
                        )}>
                          {err.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 truncate max-w-[200px]">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentErrors.length > displayedErrors.length && (
              <p className="px-4 py-2.5 text-[11px] text-zinc-600 border-t border-white/[0.06]">
                Showing {displayedErrors.length} of {recentErrors.length} errors — see the logs page for the rest.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Quick Actions Grid */}
      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href + action.name}
                href={action.href}
                className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4 hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all group flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                  <Icon size={18} className={action.color} />
                </div>
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{action.name}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
