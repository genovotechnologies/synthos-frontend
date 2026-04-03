'use client';

import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, Terminal, ScrollText } from 'lucide-react';

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
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-800/30 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DeveloperOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['developer', 'overview'],
    queryFn: developerApi.getOverview,
    retry: 1,
  });

  if (isLoading) return <Skeleton />;

  const services = data?.services ?? [];
  const stats = [
    { label: 'API Calls Today', value: (data?.total_api_calls_today ?? 0).toLocaleString() },
    { label: 'Error Rate', value: `${(data?.error_rate_percent ?? 0).toFixed(2)}%` },
    { label: 'Avg Latency', value: `${(data?.avg_latency_ms ?? 0).toFixed(0)}ms` },
  ];

  const quickLinks = [
    { name: 'API Docs', href: '/developer/api-docs', icon: BookOpen, description: 'Explore the API reference' },
    { name: 'Playground', href: '/developer/playground', icon: Terminal, description: 'Test API endpoints' },
    { name: 'Logs', href: '/developer/logs', icon: ScrollText, description: 'View request logs' },
  ];

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Developer Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Service health, API metrics, and quick access</p>
      </header>

      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Service Health</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => (
            <div key={svc.name} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-300">{svc.name}</span>
                <span className={cn('w-2.5 h-2.5 rounded-full', statusColor[svc.status] || statusColor.down)} />
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-xs font-medium',
                  svc.status === 'healthy' ? 'text-emerald-400' : svc.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {statusLabel[svc.status] || 'Unknown'}
                </span>
                {svc.latency_ms !== undefined && (
                  <span className="text-xs text-zinc-600 tabular-nums">{svc.latency_ms}ms</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-x-16">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{stat.value}</span>
              <div className="h-px bg-zinc-800 mt-4" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Quick Links</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700/50 transition-colors group"
              >
                <Icon size={16} className="text-blue-400 mb-3" />
                <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{link.name}</p>
                <p className="text-xs text-zinc-600 mt-1">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
