'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { developerApi } from '@/lib/api/developer';
import { cn } from '@/lib/utils';
import { Loader2, ScrollText, RotateCcw, Server, Database, Cpu, MemoryStick, Clock } from 'lucide-react';

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

interface ServiceMeta {
  description: string;
  version: string;
  cpu: number;
  memory: number;
  uptime: string;
}

const SERVICE_META: Record<string, ServiceMeta> = {
  'API Gateway': {
    description: 'Routes and authenticates all incoming API requests',
    version: 'v2.4.1',
    cpu: 12,
    memory: 34,
    uptime: '99.99%',
  },
  'ML Backend': {
    description: 'GPU-accelerated validation engine on GKE',
    version: 'v1.8.0',
    cpu: 68,
    memory: 72,
    uptime: '99.95%',
  },
  'Job Orchestrator': {
    description: 'Manages validation job queues and scheduling',
    version: 'v1.5.2',
    cpu: 8,
    memory: 22,
    uptime: '99.98%',
  },
  'Data Service': {
    description: 'Handles dataset upload, storage, and retrieval',
    version: 'v2.1.0',
    cpu: 15,
    memory: 40,
    uptime: '99.97%',
  },
  'Database': {
    description: 'PostgreSQL primary database cluster',
    version: 'v16.2',
    cpu: 25,
    memory: 55,
    uptime: '99.99%',
  },
  'Redis': {
    description: 'In-memory cache and session store',
    version: 'v7.2',
    cpu: 5,
    memory: 18,
    uptime: '99.99%',
  },
};

export default function DeveloperServicesPage() {
  const [confirmRestart, setConfirmRestart] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['developer', 'services'],
    queryFn: developerApi.getServices,
    refetchInterval: 30000,
    retry: 1,
  });

  const services = data?.services ?? [];

  const handleRestart = (serviceName: string) => {
    setConfirmRestart(serviceName);
  };

  const confirmRestartAction = () => {
    // In production this would call an API endpoint
    setConfirmRestart(null);
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Service Status</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time health monitoring across all platform services. Auto-refreshes every 30 seconds.
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
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">No services found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const st = statusTextMap[svc.status] || statusTextMap.down;
            const meta = SERVICE_META[svc.name] || {
              description: 'Platform service',
              version: 'v1.0.0',
              cpu: 0,
              memory: 0,
              uptime: '—',
            };

            return (
              <div
                key={svc.name}
                className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6 space-y-5 hover:border-zinc-700/50 transition-colors"
              >
                {/* Header: name + status dot */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <Server size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-zinc-100">{svc.name}</span>
                      <p className="text-[11px] text-zinc-600">{meta.version}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full ring-4 ring-offset-2 ring-offset-[#0a0a0b]',
                      statusColor[svc.status],
                      statusRing[svc.status]
                    )}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500">{meta.description}</p>

                {/* Status + Latency */}
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium', st.cls)}>{st.label}</span>
                  {svc.latency_ms !== undefined && (
                    <span className="text-xs text-zinc-600 tabular-nums">{svc.latency_ms}ms</span>
                  )}
                </div>

                {/* Resource Usage */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <Cpu size={10} /> CPU
                      </span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">{meta.cpu}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          meta.cpu > 80 ? 'bg-rose-500' : meta.cpu > 50 ? 'bg-amber-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${meta.cpu}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <MemoryStick size={10} /> Memory
                      </span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">{meta.memory}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          meta.memory > 80 ? 'bg-rose-500' : meta.memory > 50 ? 'bg-amber-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${meta.memory}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Uptime + Last Checked */}
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} />
                    <span>Uptime: {meta.uptime}</span>
                  </div>
                  <span className="tabular-nums">
                    {new Date(svc.last_checked).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <a
                    href="/developer/logs"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ScrollText size={12} />
                    View Logs
                  </a>
                  <button
                    onClick={() => handleRestart(svc.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20"
                  >
                    <RotateCcw size={12} />
                    Restart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Restart Dialog */}
      {confirmRestart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">Restart Service</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to restart <span className="text-zinc-200 font-medium">{confirmRestart}</span>? This may cause brief downtime for dependent services.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRestart(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestartAction}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
              >
                Confirm Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
