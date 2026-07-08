'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { developerApi } from '@/lib/api/developer';
import { platformApi } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Users, Tag, ArrowRight, Shield, Clock, ExternalLink, AlertCircle } from 'lucide-react';

const statusDotColor: Record<string, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
};

// Tolerant reads for audit events — backends vary in field naming. Keep in sync
// with the identical helper in src/app/admin/audit-log/page.tsx.
function readAuditEvent(event: Record<string, unknown>) {
  return {
    action: String(event.action || event.event_type || event.description || ''),
    actor: String(event.admin_name || event.admin_email || event.user_email || event.actor || ''),
    time: (event.timestamp || event.created_at) as string | undefined,
  };
}

function InlineLoadError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-rose-400">
      <AlertCircle size={14} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-800/50 rounded" />
        <div className="h-4 w-72 bg-zinc-800/30 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-20 bg-zinc-800/30 rounded" />
            <div className="h-8 w-24 bg-zinc-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  // Growth series — hidden until the backend ships /admin/analytics/growth.
  const { data: growth } = useQuery({
    queryKey: ['admin', 'growth'],
    queryFn: () => platformApi.getAdminGrowth(30),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
    retry: 1,
  });

  const { data: auditData, isError: auditIsError } = useQuery({
    queryKey: ['admin', 'audit-log', 'recent'],
    queryFn: () => adminApi.getAuditLog(1, 5),
    retry: 1,
  });

  const { data: servicesData, isError: servicesIsError } = useQuery({
    queryKey: ['developer', 'services'],
    queryFn: developerApi.getServices,
    retry: 1,
  });

  if (isLoading) return <Skeleton />;

  const stats = [
    { label: 'Total Users', value: data?.total_users ?? 0 },
    { label: 'Total Validations', value: data?.total_validations ?? 0 },
    { label: 'Total Datasets', value: data?.total_datasets ?? 0 },
    { label: 'Credits Purchased', value: (data?.total_credits_purchased ?? 0).toLocaleString() },
  ];

  const roleEntries = Object.entries(data?.users_by_role ?? {});
  const auditEvents = auditData?.events ?? [];
  const rawServices = servicesData?.services ?? {};
  const services = Array.isArray(rawServices)
    ? rawServices
    : Object.entries(rawServices).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        ...(value as Record<string, unknown>),
      })) as { name: string; status: string; latency_ms?: number }[];

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">System-wide metrics and administration</p>
      </header>

      <section>
        {isError ? (
          <div className="panel p-5">
            <InlineLoadError message="Failed to load platform metrics" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">{stat.label}</p>
                <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </span>
                <div className="h-px bg-zinc-800 mt-4" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Growth (backend >= admin growth analytics) */}
      {growth && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-5">Growth — last 30 days</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="signupsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="validationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} dy={8} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} width={30} tickCount={4} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="surface px-3.5 py-2.5 space-y-0.5">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
                        {payload.map((entry) => (
                          <p key={String(entry.dataKey)} className="text-sm text-zinc-100 tabular-nums">
                            {Number(entry.value ?? 0).toLocaleString()}
                            <span className="text-zinc-500 font-normal"> {String(entry.dataKey)}</span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  iconType="circle"
                  iconSize={7}
                  formatter={(value: string) => <span className="text-[11px] text-zinc-500 capitalize">{value}</span>}
                />
                <Area type="monotone" dataKey="signups" stroke="#8b5cf6" strokeWidth={2} fill="url(#signupsGradient)" activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#09090b', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="validations" stroke="#059669" strokeWidth={2} fill="url(#validationsGradient)" activeDot={{ r: 4, fill: '#059669', stroke: '#09090b', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* System Health */}
      {(services.length > 0 || servicesIsError) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">System Health</p>
            <Link href="/developer/services" className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Open service status (developer)
              <ExternalLink size={11} />
            </Link>
          </div>
          <div className="panel p-5">
            {servicesIsError ? (
              <InlineLoadError message="Failed to load service health" />
            ) : (
              <div className="flex flex-wrap gap-4">
                {services.map((svc) => (
                  <div key={svc.name} className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', statusDotColor[svc.status] || statusDotColor.down)} />
                    <span className="text-sm text-zinc-400">{svc.name}</span>
                    {svc.latency_ms !== undefined && (
                      <span className="text-xs text-zinc-600 tabular-nums">{svc.latency_ms}ms</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Activity (Audit Log) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Recent Activity</p>
          <Link href="/admin/audit-log" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            View full audit log
          </Link>
        </div>
        {auditIsError ? (
          <div className="panel p-6">
            <InlineLoadError message="Failed to load recent activity" />
          </div>
        ) : auditEvents.length === 0 ? (
          <div className="panel p-6 text-center">
            <p className="text-sm text-zinc-600">No recent admin activity</p>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {auditEvents.slice(0, 5).map((event: Record<string, unknown>, idx: number) => {
                const { action, actor, time } = readAuditEvent(event);
                return (
                  <div key={String(event.id ?? idx)} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{action || 'Admin action'}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{actor || 'System'}</p>
                    </div>
                    <span className="text-xs text-zinc-600 tabular-nums shrink-0">
                      {time
                        ? new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {roleEntries.length > 0 && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Users by Role</p>
          <div className="panel p-5">
            <div className="space-y-3">
              {roleEntries.map(([role, count]) => (
                <div key={role} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
                      role === 'admin' ? 'bg-rose-500/15 text-rose-400' :
                      role === 'developer' ? 'bg-blue-500/15 text-blue-400' :
                      role === 'support' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-zinc-800 text-zinc-400'
                    )}>
                      {role}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-300 tabular-nums font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users" className="flex items-center justify-between panel p-5 hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-rose-400" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Manage Users</span>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
          <Link href="/admin/promo-codes" className="flex items-center justify-between panel p-5 hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-rose-400" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Promo Codes</span>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
          <Link href="/admin/warranties" className="flex items-center justify-between panel p-5 hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Manage Warranties</span>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
        </div>
      </section>
    </div>
  );
}
