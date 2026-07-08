'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, validationsApi, datasetsApi, apiClient, type UsageAnalytics } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, AlertCircle, Loader2, Upload, CheckCircle, Code, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/providers/auth-provider';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface px-3.5 py-2.5">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-zinc-100 tabular-nums">
        {(payload[0]?.value ?? 0).toLocaleString()}
        <span className="text-zinc-500 font-normal"> % risk</span>
      </p>
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

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: analyticsApi.getUsage,
    retry: 1,
  });

  const { data: validationsData, isLoading: validationsLoading, error: validationsError } = useQuery({
    queryKey: ['validations', 'recent'],
    queryFn: () => validationsApi.list(1, 8),
    retry: 1,
  });

  const { data: datasetsData, error: datasetsError } = useQuery({
    queryKey: ['datasets', 'list'],
    queryFn: () => datasetsApi.list(1, 10),
    retry: 1,
  });

  const { data: qualityTrends } = useQuery({
    queryKey: ['analytics', 'quality-trends'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/quality-trends?period=30d');
      return data;
    },
    retry: 1,
  });

  const { data: benchmarksData } = useQuery({
    queryKey: ['analytics', 'benchmarks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/benchmarks');
      return data;
    },
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

  const isNewUser = stats.total_datasets === 0 && stats.total_validations === 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || '';
  const trendPoints = qualityTrends?.data_points || qualityTrends?.points || qualityTrends;
  const chartData = Array.isArray(trendPoints) && trendPoints.length > 0
    ? trendPoints.map((point: { date?: string; name?: string; label?: string; risk_score?: number; value?: number; score?: number }) => ({
        name: point.date || point.name || point.label || '',
        value: point.risk_score ?? point.value ?? point.score ?? 0,
      }))
    : null;
  const qualityScore = Math.max(0, 100 - (stats.avg_risk_score || 0));
  const readyDatasets = datasetsData?.datasets?.filter(d => d.status === 'ready' || d.status === 'processed').length || 0;
  const failedValidations = validationsData?.validations?.filter(v => v.status === 'failed').length || 0;

  return (
    <div className="space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[26px] font-semibold text-zinc-100 tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of your validation activity and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/datasets"
            className="px-4 py-2 rounded-full text-[13px] font-medium text-zinc-300 bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.07] hover:text-zinc-100 transition-all"
          >
            Upload data
          </Link>
          <Link
            href="/dashboard/validations"
            className="px-4 py-2 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_28px_-10px_rgba(139,92,246,0.6)] hover:shadow-[0_0_32px_-8px_rgba(139,92,246,0.75)] transition-all"
          >
            New validation
          </Link>
        </div>
      </header>

      {(analyticsError || validationsError || datasetsError) ? (
        <div className="space-y-2">
          {analyticsError ? (
            <div className="flex items-center gap-2 text-sm text-amber-500/80">
              <AlertCircle size={14} />
              <span>Unable to connect to analytics service</span>
            </div>
          ) : null}
          {validationsError ? (
            <div className="flex items-center gap-2 text-sm text-amber-500/80">
              <AlertCircle size={14} />
              <span>Unable to load validations</span>
            </div>
          ) : null}
          {datasetsError ? (
            <div className="flex items-center gap-2 text-sm text-amber-500/80">
              <AlertCircle size={14} />
              <span>Unable to load datasets</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {isNewUser && (
        <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-8">
          <h2 className="text-lg font-semibold text-white mb-1">
            Welcome to Synthos{firstName ? `, ${firstName}` : ''}! Let&apos;s get you set up.
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            You&apos;re just a few steps away from AI-powered training data validation. Follow the steps below to get started.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Upload your first dataset',
                description: 'Upload a training dataset to analyze for collapse risk and quality issues.',
                href: '/dashboard/datasets',
                icon: Upload,
                done: stats.total_datasets > 0,
              },
              {
                title: 'Run your first validation',
                description: 'Start a validation job to get quality scores and training predictions.',
                href: '/dashboard/validations',
                icon: CheckCircle,
                done: stats.total_validations > 0,
              },
              {
                title: 'Explore API documentation',
                description: 'Integrate Synthos into your ML pipeline with our comprehensive API.',
                href: '/docs',
                icon: Code,
                done: false,
              },
            ].map((step) => (
              <Link
                key={step.title}
                href={step.href}
                className="group relative flex flex-col gap-3 p-5 rounded-lg border border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-800/30 hover:border-zinc-700/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    step.done ? 'bg-emerald-500/15' : 'bg-violet-500/15'
                  )}>
                    {step.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <step.icon className="w-5 h-5 text-violet-400" />
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{step.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">{step.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10">
          <Link href="/dashboard/datasets" className="group block lg:pr-10">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Datasets
              <ArrowUpRight size={11} className="text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 transition-all" />
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] leading-none font-semibold text-zinc-100 tabular-nums tracking-tight">{stats.total_datasets}</span>
              <span className="text-[13px] text-zinc-600">{readyDatasets} ready</span>
            </div>
          </Link>

          <Link href="/dashboard/validations" className="group block lg:border-l lg:border-white/[0.06] lg:px-10">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Validations
              <ArrowUpRight size={11} className="text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 transition-all" />
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] leading-none font-semibold text-zinc-100 tabular-nums tracking-tight">{stats.total_validations}</span>
              <span className="flex items-center gap-1 text-[13px] text-emerald-500">
                <ArrowUpRight size={12} />{stats.validations_this_month} this month
              </span>
            </div>
          </Link>

          <div className="cursor-default lg:border-l lg:border-white/[0.06] lg:px-10">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Rows Processed</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] leading-none font-semibold text-zinc-100 tabular-nums tracking-tight">{(stats.total_rows_validated / 1000).toFixed(1)}k</span>
              <span className="text-[13px] text-zinc-600">{(stats.rows_this_month / 1000).toFixed(1)}k this month</span>
            </div>
          </div>

          <div className="cursor-default lg:border-l lg:border-white/[0.06] lg:pl-10">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Quality Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] leading-none font-semibold text-zinc-100 tabular-nums tracking-tight">{qualityScore}%</span>
              {stats.avg_risk_score > 0 && (
                <span className="flex items-center gap-1 text-[13px] text-rose-500">
                  <ArrowDownRight size={12} />{stats.avg_risk_score}% risk
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isNewUser && benchmarksData && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Performance Benchmarks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Your Performance */}
            <div className="panel p-5">
              <p className="text-xs text-zinc-500 mb-1">Your Average Risk Score</p>
              <p className="text-2xl font-semibold text-zinc-100 tabular-nums">
                {benchmarksData.user_avg_risk_score?.toFixed(1) ?? stats.avg_risk_score?.toFixed(1) ?? '0'}%
              </p>
            </div>

            {/* Platform Average */}
            <div className="panel p-5">
              <p className="text-xs text-zinc-500 mb-1">Platform Average</p>
              <p className="text-2xl font-semibold text-zinc-100 tabular-nums">
                {benchmarksData.platform_avg_risk_score?.toFixed(1) ?? '—'}%
              </p>
            </div>

            {/* Percentile */}
            <div className="panel p-5">
              <p className="text-xs text-zinc-500 mb-2">
                Better than {benchmarksData.percentile ?? '—'}% of validated datasets
              </p>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${benchmarksData.percentile ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1 tabular-nums">
                {benchmarksData.percentile ?? 0}th percentile
              </p>
            </div>
          </div>

          {/* Dimension comparison */}
          {benchmarksData.dimensions && (
            <div className="mt-4 panel p-5">
              <p className="text-xs text-zinc-500 mb-4">Dimension Comparison (You vs Platform Average)</p>
              <div className="space-y-3">
                {(
                  [
                    { key: 'distribution_fidelity', label: 'Distribution Fidelity' },
                    { key: 'feature_correlation', label: 'Feature Correlation' },
                    { key: 'temporal_consistency', label: 'Temporal Consistency' },
                    { key: 'outlier_detection', label: 'Outlier Detection' },
                    { key: 'schema_compliance', label: 'Schema Compliance' },
                  ] as const
                ).map((dim) => {
                  const userVal = benchmarksData.dimensions?.[dim.key]?.user ?? 0;
                  const platformVal = benchmarksData.dimensions?.[dim.key]?.platform ?? 0;
                  return (
                    <div key={dim.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-500">{dim.label}</span>
                        <span className="text-zinc-600 tabular-nums">
                          {userVal} / {platformVal}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${userVal}%` }}
                          />
                        </div>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-600 rounded-full"
                            style={{ width: `${platformVal}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />You</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600" />Platform Avg</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

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
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Risk Score Trend</p>
            <span className="text-xs text-zinc-600">{chartData ? `Last ${chartData.length} data points` : 'Last 30 days'}</span>
          </div>
          <div className="h-56">
            {chartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} dy={8} interval="preserveStartEnd" />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#3f3f46', fontSize: 10 }}
                    width={34}
                    tickCount={4}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                    activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#09090b', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-zinc-600">
                No trend data yet. Complete validations to see quality trends.
              </div>
            )}
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
            <div className="pt-4 mt-4 border-t border-white/[0.06]">
              <Link href="/dashboard/validations" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all activity →</Link>
            </div>
          ) : null}
        </div>
      </section>

      {validationsData?.validations?.length ? (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Validation History</p>
          <div className="border-t border-white/[0.06]">
            <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-white/[0.06]">
              <div className="col-span-4">Dataset</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Risk Score</div>
              <div className="col-span-2 text-right">Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {validationsData.validations.map((v) => (
              <Link key={v.id} href={`/dashboard/validations/${v.id}`} className="grid grid-cols-12 gap-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-xs font-medium text-zinc-400 group-hover:bg-zinc-800 transition-colors">{v.dataset_name?.charAt(0).toUpperCase() || 'D'}</div>
                  <span className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{v.dataset_name || 'Untitled'}</span>
                </div>
                <div className="col-span-2 flex items-center"><span className="text-sm text-zinc-500">{v.validation_type}</span></div>
                <div className="col-span-2 flex items-center justify-end"><span className="text-sm text-zinc-400 tabular-nums">{(v.risk_score ?? v.results?.risk_score) != null ? `${v.risk_score ?? v.results?.risk_score}%` : '—'}</span></div>
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
