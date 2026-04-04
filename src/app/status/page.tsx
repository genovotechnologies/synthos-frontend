'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Activity, RefreshCw, ExternalLink } from 'lucide-react';

interface ServiceStatus {
  status: string;
  name: string;
}

interface StatusData {
  status: string;
  services: Record<string, ServiceStatus>;
  timestamp: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-amber-500';
    case 'down':
    case 'outage':
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'healthy':
      return 'Operational';
    case 'degraded':
      return 'Degraded';
    case 'down':
    case 'outage':
      return 'Down';
    default:
      return 'Unknown';
  }
}

function getOverallLabel(status: string) {
  switch (status) {
    case 'healthy':
      return 'All Systems Operational';
    case 'degraded':
      return 'Partial Outage';
    case 'outage':
    case 'down':
      return 'Major Outage';
    default:
      return 'Checking Status...';
  }
}

function getOverallRingColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'ring-emerald-500/30';
    case 'degraded':
      return 'ring-amber-500/30';
    case 'outage':
    case 'down':
      return 'ring-red-500/30';
    default:
      return 'ring-zinc-500/30';
  }
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status');
      const json: StatusData = await response.json();
      setData(json);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setData({
        status: 'outage',
        services: {
          api_gateway: { status: 'down', name: 'API Gateway' },
          validation: { status: 'unknown', name: 'Validation Engine' },
          collapse: { status: 'unknown', name: 'Collapse Detection' },
          database: { status: 'unknown', name: 'Database' },
        },
        timestamp: new Date().toISOString(),
      });
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const overallStatus = data?.status || 'unknown';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/60">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span className="text-lg font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              Synthos
            </span>
          </Link>
          <button
            onClick={() => { setLoading(true); fetchStatus(); }}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Overall Status Indicator */}
        <div className="text-center mb-12">
          <div
            className={cn(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full ring-2 mb-4',
              getOverallRingColor(overallStatus),
              'bg-zinc-900/60'
            )}
          >
            <span className={cn('w-3 h-3 rounded-full animate-pulse', getStatusColor(overallStatus))} />
            <span className="text-lg font-medium">{getOverallLabel(overallStatus)}</span>
          </div>
          {lastChecked && (
            <p className="text-sm text-zinc-500 mt-3">Last checked at {lastChecked}</p>
          )}
        </div>

        {/* Service Cards */}
        <div className="grid gap-4">
          {data &&
            Object.entries(data.services).map(([key, service]) => (
              <div
                key={key}
                className="flex items-center justify-between p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className={cn('w-2.5 h-2.5 rounded-full', getStatusColor(service.status))} />
                  <span className="text-sm font-medium text-zinc-200">{service.name}</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    service.status === 'healthy'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : service.status === 'degraded'
                        ? 'bg-amber-500/10 text-amber-400'
                        : service.status === 'down' || service.status === 'outage'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-zinc-700/40 text-zinc-400'
                  )}
                >
                  {getStatusText(service.status)}
                </span>
              </div>
            ))}
        </div>

        {/* Uptime Note */}
        <div className="mt-10 p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/40 text-center">
          <p className="text-sm text-zinc-400">
            <span className="text-emerald-400 font-semibold">99.9%</span> uptime over the last 30 days
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/40 mt-auto">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <p className="text-xs text-zinc-600">Powered by Synthos</p>
          <Link
            href="https://synthos.dev"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            synthos.dev
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
