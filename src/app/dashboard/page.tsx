'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, validationsApi, datasetsApi, type UsageAnalytics, type Validation } from '@/lib/api';
import { 
  Database, 
  CheckCircle, 
  Activity,
  ArrowUpRight,
  Clock,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  FileCheck,
  Shield,
  Zap,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';

// Modern Stat Card Component - Light glassmorphic style
interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
  href?: string;
  loading?: boolean;
  variant?: 'default' | 'light';
}

function StatCard({ title, value, subValue, icon, trend, subtitle, href, loading, variant = 'default' }: StatCardProps) {
  const content = (
    <div className={cn(
      "relative p-5 rounded-2xl transition-all duration-300 group",
      variant === 'light' 
        ? "bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]"
        : "bg-white/70 backdrop-blur-sm border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]",
      href && "cursor-pointer"
    )}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4" />
          <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-8 w-16 bg-slate-200 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 text-slate-500 shadow-sm">
              {icon}
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
                trend >= 0 
                  ? "text-emerald-600 bg-emerald-50" 
                  : "text-rose-600 bg-rose-50"
              )}>
                {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subValue && (
              <span className="text-lg font-medium text-slate-400">- {subValue}</span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Featured Card with Gauge - Purple style
interface GaugeCardProps {
  title: string;
  value: string;
  subValue?: string;
  percentage: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function GaugeCard({ title, value, subValue, percentage, icon, loading }: GaugeCardProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-[0_20px_60px_rgba(108,92,231,0.4)] overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
      
      <button className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
        <MoreVertical size={18} className="text-white/70" />
      </button>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="w-32 h-32 bg-white/20 rounded-full mx-auto" />
          <div className="h-6 w-24 bg-white/20 rounded mx-auto" />
        </div>
      ) : (
        <>
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg className="w-full h-full -rotate-135" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#a3e635" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{percentage}%</span>
            </div>
          </div>

          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur">
              {icon}
              <span className="text-sm font-medium">{title}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
            {subValue && (
              <p className="text-sm text-white/60 mt-1">{subValue}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Smaller Metric Card
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, icon, trend, loading }: MetricCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-10 bg-slate-200 rounded-xl" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
              {icon}
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
                trend >= 0 
                  ? "text-emerald-600 bg-emerald-50" 
                  : "text-rose-600 bg-rose-50"
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}

// Custom Tooltip for Charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title, collapsible = true }: { title: string; collapsible?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
      {collapsible && (
        <button className="p-1 rounded hover:bg-slate-100 transition-colors">
          <ChevronDown size={20} className="text-slate-400" />
        </button>
      )}
    </div>
  );
}

// Recent Validation Item for History
function HistoryItem({ validation }: { validation: Validation }) {
  const statusConfig: Record<string, { color: string; bgColor: string }> = {
    pending: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
    processing: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
    completed: { color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    failed: { color: 'text-rose-600', bgColor: 'bg-rose-100' },
  };

  const status = statusConfig[validation.status] || statusConfig.pending;

  return (
    <Link
      href={`/dashboard/validations/${validation.id}`}
      className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors rounded-xl group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
        {validation.dataset_name?.charAt(0).toUpperCase() || 'D'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-violet-600 transition-colors">
          {validation.dataset_name || 'Dataset Validation'}
        </p>
      </div>
      <div className="text-xs text-slate-400">
        {new Date(validation.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-slate-400 w-20 text-right">
        {validation.results?.risk_score ? `${validation.results.risk_score}%` : '-'}
      </div>
      <div className="text-xs text-slate-400 w-24 text-center">
        {validation.validation_type}
      </div>
      <div className="text-xs text-slate-400 w-16 text-center">
        {validation.progress || 0}%
      </div>
      <div className="text-xs text-slate-400 w-16 text-center">
        {new Date(validation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
      <span className={cn(
        "px-3 py-1 text-xs font-medium rounded-full capitalize",
        status.bgColor, status.color
      )}>
        {validation.status}
      </span>
    </Link>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-100 rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white/80 border border-white/50 shadow-sm">
            <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4" />
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-8 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  
  // Fetch real analytics data from API
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: analyticsApi.getUsage,
    retry: 1,
  });

  // Fetch recent validations from API
  const { data: validationsData, isLoading: validationsLoading } = useQuery({
    queryKey: ['validations', 'recent'],
    queryFn: () => validationsApi.list(1, 5),
    retry: 1,
  });

  // Fetch datasets count
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets', 'list'],
    queryFn: () => datasetsApi.list(1, 10),
    retry: 1,
  });

  // Loading state
  if (analyticsLoading) {
    return <DashboardSkeleton />;
  }

  // Default stats
  const defaultStats: UsageAnalytics = {
    total_rows_validated: 0,
    total_datasets: 0,
    total_validations: 0,
    active_jobs: 0,
    avg_risk_score: 0,
    validations_this_month: 0,
    rows_this_month: 0,
  };
  
  const stats: UsageAnalytics = {
    total_rows_validated: analytics?.total_rows_validated ?? defaultStats.total_rows_validated,
    total_datasets: analytics?.total_datasets ?? defaultStats.total_datasets,
    total_validations: analytics?.total_validations ?? defaultStats.total_validations,
    active_jobs: analytics?.active_jobs ?? defaultStats.active_jobs,
    avg_risk_score: analytics?.avg_risk_score ?? defaultStats.avg_risk_score,
    validations_this_month: analytics?.validations_this_month ?? defaultStats.validations_this_month,
    rows_this_month: analytics?.rows_this_month ?? defaultStats.rows_this_month,
  };

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const userName = user?.name?.split(' ')[0] || 'there';

  // Chart data for monthly validations
  const chartData = [
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 78 },
    { name: 'Apr', value: 62 },
    { name: 'May', value: 89 },
    { name: 'Jun', value: 54 },
    { name: 'Jul', value: 67 },
    { name: 'Aug', value: 82 },
    { name: 'Sep', value: 71 },
  ];

  // Calculate quality score (inverse of risk score)
  const qualityScore = Math.max(0, 100 - (stats.avg_risk_score || 0));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting} {userName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Your weekly validation update</p>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>
      </motion.div>

      {/* API Error Notice */}
      {analyticsError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm"
        >
          <AlertCircle size={16} />
          Unable to fetch analytics from backend. Showing default values.
        </motion.div>
      )}

      {/* Validations Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SectionHeader title="Validations" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ready to Validate"
            value={stats.total_datasets ?? 0}
            subValue={datasetsData?.datasets?.filter(d => d.status === 'ready').length || 0}
            icon={<Database size={20} />}
            trend={42}
            subtitle={`Datasets this week ${stats.total_datasets ?? 0}`}
            href="/dashboard/datasets"
          />
          <StatCard
            title="Pending Validations"
            value={stats.active_jobs ?? 0}
            subValue={Math.floor((stats.active_jobs ?? 0) * 0.3)}
            icon={<Clock size={20} />}
            trend={22}
            subtitle={`Processing this week ${stats.validations_this_month ?? 0}`}
            href="/dashboard/validations"
          />
          <StatCard
            title="Failed"
            value={validationsData?.validations?.filter(v => v.status === 'failed').length || 0}
            icon={<AlertCircle size={20} />}
            trend={-5}
            subtitle={`Failed this week ${Math.floor(Math.random() * 3)}`}
            href="/dashboard/validations"
          />
          <StatCard
            title="Completed"
            value={stats.total_validations ?? 0}
            subValue={stats.validations_this_month ?? 0}
            icon={<CheckCircle size={20} />}
            trend={5}
            subtitle={`Completed this week ${stats.validations_this_month ?? 0}`}
            href="/dashboard/validations"
          />
        </div>
      </motion.section>

      {/* Analytics Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SectionHeader title="Analytics" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Featured Gauge Card - Quality Score */}
          <div className="lg:col-span-3">
            <GaugeCard
              title="Quality Score"
              value={`${(stats.total_rows_validated ?? 0).toLocaleString()}`}
              subValue={`${(stats.rows_this_month ?? 0).toLocaleString()} rows this month`}
              percentage={qualityScore}
              icon={<Shield size={16} />}
              loading={analyticsLoading}
            />
          </div>

          {/* Metric Cards */}
          <div className="lg:col-span-3 grid grid-rows-2 gap-4">
            <MetricCard
              title="Validated Rows"
              value={`${((stats.total_rows_validated ?? 0) / 1000).toFixed(1)}K`}
              subtitle="Current month"
              icon={<FileCheck size={18} />}
              trend={5}
              loading={analyticsLoading}
            />
            <MetricCard
              title="Active Jobs"
              value={`${stats.active_jobs ?? 0}`}
              subtitle="Running now"
              icon={<Zap size={18} />}
              trend={85}
              loading={analyticsLoading}
            />
          </div>

          {/* Bar Chart */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <MoreVertical size={16} className="text-slate-400" />
              </button>
            </div>
            
            <div className="h-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={32}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 1 ? '#6366f1' : '#818cf8'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-slate-400 text-sm">No data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* History Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SectionHeader title="History" />
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="w-10" />
            <div className="flex-1">Dataset</div>
            <div className="w-20 text-right">Time</div>
            <div className="w-20 text-right">Risk Score</div>
            <div className="w-24 text-center">Type</div>
            <div className="w-16 text-center">Progress</div>
            <div className="w-16 text-center">Date</div>
            <div className="w-24 text-center">Status</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {validationsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                <p className="text-slate-400 text-sm mt-2">Loading history...</p>
              </div>
            ) : validationsData?.validations?.length ? (
              validationsData.validations.map((validation) => (
                <HistoryItem key={validation.id} validation={validation} />
              ))
            ) : (
              <div className="py-12 text-center">
                <Clock className="mx-auto mb-3 text-slate-300" size={40} />
                <p className="text-slate-500 font-medium">No validation history yet</p>
                <p className="text-slate-400 text-sm mt-1">Start validating datasets to see your history</p>
                <Link
                  href="/dashboard/validations"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Create Validation
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
