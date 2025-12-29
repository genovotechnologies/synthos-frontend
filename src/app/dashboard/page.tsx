'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, validationsApi, datasetsApi, type UsageAnalytics } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/providers/auth-provider';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 px-3 py-2 rounded-md border border-zinc-800">
      <p className="text-[11px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-zinc-100">{(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500',
    processing: 'bg-blue-500 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full", colors[status] || colors.pending)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-800/50 rounded" />
        <div className="h-4 w-72 bg-zinc-800/30 rounded" />
      </div>
      <div className="grid grid-cols-4 gap-12">
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

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: analyticsApi.getUsage,
    retry: 1,
  });

  const { data: validationsData, isLoading: validationsLoading } = useQuery({
    queryKey: ['validations', 'recent'],
    queryFn: () => validationsApi.list(1, 8),
    retry: 1,
  });

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets', 'list'],
    queryFn: () => datasetsApi.list(1, 10),
    retry: 1,
  });

  if (analyticsLoading) return <DashboardSkeleton />;

  const stats: UsageAnalytics = {
    total_rows_validated: analytics?.total_rows_validated ?? 0,
    total_datasets: analytics?.total_datasets ?? 0,
    total_validations: analytics?.total_validations ?? 0,
    active_jobs: analytics?.active_jobs ?? 0,
    avg_risk_score: analytics?.avg_risk_score ?? 0,
    validations_this_month: analytics?.validations_this_month ?? 0,
    rows_this_month: analytics?.rows_this_month ?? 0,
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || '';
  const chartData = [
    { name: 'Jan', value: 32 }, { name: 'Feb', value: 45 }, { name: 'Mar', value: 78 },
    { name: 'Apr', value: 62 }, { name: 'May', value: 89 }, { name: 'Jun', value: 54 }, { name: 'Jul', value: 67 },
  ];
  const qualityScore = Math.max(0, 100 - (stats.avg_risk_score || 0));
  const readyDatasets = datasetsData?.datasets?.filter(d => d.status === 'ready').length || 0;
  const failedValidations = validationsData?.validations?.filter(v => v.status === 'failed').length || 0;

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your validation activity and system health</p>
      </header>

      {analyticsError && (
        <div className="flex items-center gap-2 text-sm text-amber-500/80">
          <AlertCircle size={14} />
          <span>Unable to connect to analytics service</span>
        </div>
      )}

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-10">
          <Link href="/dashboard/datasets" className="group">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Datasets</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{stats.total_datasets}</span>
              <span className="text-sm text-zinc-600">{readyDatasets} ready</span>
            </div>
            <div className="h-px bg-zinc-800 mt-4 group-hover:bg-zinc-700 transition-colors" />
          </Link>

          <Link href="/dashboard/validations" className="group">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Validations</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{stats.total_validations}</span>
              <span className="flex items-center gap-1 text-sm text-emerald-500">
                <ArrowUpRight size={12} />{stats.validations_this_month} this month
              </span>
            </div>
            <div className="h-px bg-zinc-800 mt-4 group-hover:bg-zinc-700 transition-colors" />
          </Link>

          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Rows Processed</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{(stats.total_rows_validated / 1000).toFixed(1)}k</span>
              <span className="text-sm text-zinc-600">{(stats.rows_this_month / 1000).toFixed(1)}k this month</span>
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>

          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Quality Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-zinc-100 tabular-nums tracking-tight">{qualityScore}%</span>
              {stats.avg_risk_score > 0 && (
                <span className="flex items-center gap-1 text-sm text-rose-500">
                  <ArrowDownRight size={12} />{stats.avg_risk_score}% risk
                </span>
              )}
            </div>
            <div className="h-px bg-zinc-800 mt-4" />
          </div>
        </div>
      </section>

      <section className="flex items-center gap-16 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Active jobs</span>
          <span className="font-medium text-zinc-200 tabular-nums">{stats.active_jobs}</span>
          {stats.active_jobs > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </div>
        <div className="w-px h-4 bg-zinc-800" />
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Failed</span>
          <span className={cn("font-medium tabular-nums", failedValidations > 0 ? "text-rose-400" : "text-zinc-200")}>{failedValidations}</span>
        </div>
        <div className="w-px h-4 bg-zinc-800" />
        <Link href="/dashboard/validations" className="text-zinc-500 hover:text-zinc-300 transition-colors">View all validations →</Link>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Validation Trend</p>
            <span className="text-xs text-zinc-600">Last 7 months</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} dy={8} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={1.5} fill="url(#chartGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Recent Activity</p>
          </div>
          <div className="space-y-1">
            {validationsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-zinc-600" /></div>
            ) : validationsData?.validations?.length ? (
              validationsData.validations.slice(0, 6).map((v) => (
                <Link key={v.id} href={`/dashboard/validations/${v.id}`} className="flex items-center gap-4 py-2.5 group">
                  <StatusDot status={v.status} />
                  <span className="flex-1 text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{v.dataset_name || 'Untitled validation'}</span>
                  <span className="text-xs text-zinc-600 tabular-nums">{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-600 py-4">No recent activity</p>
            )}
          </div>
          {validationsData?.validations?.length ? (
            <div className="pt-4 mt-4 border-t border-zinc-800/50">
              <Link href="/dashboard/validations" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all activity →</Link>
            </div>
          ) : null}
        </div>
      </section>

      {validationsData?.validations?.length ? (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Validation History</p>
          <div className="border-t border-zinc-800/50">
            <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
              <div className="col-span-4">Dataset</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Risk Score</div>
              <div className="col-span-2 text-right">Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {validationsData.validations.map((v) => (
              <Link key={v.id} href={`/dashboard/validations/${v.id}`} className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors group">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-xs font-medium text-zinc-400 group-hover:bg-zinc-800 transition-colors">{v.dataset_name?.charAt(0).toUpperCase() || 'D'}</div>
                  <span className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{v.dataset_name || 'Untitled'}</span>
                </div>
                <div className="col-span-2 flex items-center"><span className="text-sm text-zinc-500">{v.validation_type}</span></div>
                <div className="col-span-2 flex items-center justify-end"><span className="text-sm text-zinc-400 tabular-nums">{v.results?.risk_score ? `${v.results.risk_score}%` : '—'}</span></div>
                <div className="col-span-2 flex items-center justify-end"><span className="text-sm text-zinc-500 tabular-nums">{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
                <div className="col-span-2 flex items-center justify-end gap-2"><StatusDot status={v.status} /><span className="text-sm text-zinc-500 capitalize">{v.status}</span></div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
