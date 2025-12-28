'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, validationsApi, type UsageAnalytics, type Validation } from '@/lib/api';
import { 
  Database, 
  CheckCircle, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock,
  ArrowDownRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

// Stats Card Component - Linear Style (No shadows, bordered)
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  href?: string;
  loading?: boolean;
}

function StatsCard({ title, value, icon, trend, trendLabel, href, loading }: StatsCardProps) {
  const content = (
    <div className={cn(
      "relative p-5 rounded-xl border border-white/10 bg-zinc-950/50",
      "hover:border-white/20 hover:bg-zinc-900/50 transition-all duration-200",
      href && "cursor-pointer"
    )}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-zinc-800 rounded-lg mb-4" />
          <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
          <div className="h-8 w-16 bg-zinc-800 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              {icon}
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend >= 0 
                  ? "text-green-400 bg-green-500/10" 
                  : "text-red-400 bg-red-500/10"
              )}>
                {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          
          <p className="text-sm text-zinc-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
          
          {trendLabel && (
            <p className="text-xs text-zinc-600 mt-2">{trendLabel}</p>
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

// Custom Tooltip for Charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
}

// Recent Validation Item
function RecentValidationItem({ validation }: { validation: Validation }) {
  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; dot: string; animate?: boolean }> = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
    processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400', animate: true },
    completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
  };

  const status = statusConfig[validation.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/dashboard/validations/${validation.id}`}
      className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", status.bg)}>
          <StatusIcon size={16} className={cn(status.color, status.animate ? "animate-spin" : "")} />
        </div>
        <div>
          <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">
            {validation.dataset_name || 'Dataset Validation'}
          </p>
          <p className="text-xs text-zinc-500">{validation.validation_type}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full capitalize",
          status.bg, status.color
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          {validation.status}
        </span>
        <span className="text-xs text-zinc-500">
          {new Date(validation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </Link>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-64 bg-zinc-800/50 rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-white/10 bg-zinc-950/50">
            <div className="h-10 w-10 bg-zinc-800 rounded-lg mb-4" />
            <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
            <div className="h-8 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-zinc-950/50 h-80" />
        <div className="p-6 rounded-xl border border-white/10 bg-zinc-950/50 h-80" />
      </div>
    </div>
  );
}

export default function DashboardOverview() {
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

  // Loading state
  if (analyticsLoading) {
    return <DashboardSkeleton />;
  }

  // Default stats (used when API fails or returns empty) - with null safety
  const defaultStats: UsageAnalytics = {
    total_rows_validated: 0,
    total_datasets: 0,
    total_validations: 0,
    active_jobs: 0,
    avg_risk_score: 0,
    validations_this_month: 0,
    rows_this_month: 0,
  };
  
  // Merge with defaults to ensure all values are defined
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

  // Sample chart data - This would come from GET /analytics/validation-history in production
  const chartData = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 18 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 8 },
    { name: 'Sun', value: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-semibold text-white">{greeting}</h1>
        <p className="text-zinc-500">
          Here&apos;s an overview of your validation activity
        </p>
      </motion.div>

      {/* API Error Notice */}
      {analyticsError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm"
        >
          <AlertCircle size={16} />
          Unable to fetch analytics from backend. Showing default values.
        </motion.div>
      )}

      {/* Stats Grid - Fetches from GET /analytics/usage */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatsCard
          title="Total Rows Validated"
          value={(stats.total_rows_validated ?? 0).toLocaleString()}
          icon={<Database size={20} />}
          trend={12}
          trendLabel={`${(stats.rows_this_month ?? 0).toLocaleString()} this month`}
          href="/dashboard/datasets"
        />
        <StatsCard
          title="Validations"
          value={stats.total_validations ?? 0}
          icon={<CheckCircle size={20} />}
          trend={8}
          trendLabel={`${stats.validations_this_month ?? 0} this month`}
          href="/dashboard/validations"
        />
        <StatsCard
          title="Active Jobs"
          value={stats.active_jobs ?? 0}
          icon={<Activity size={20} />}
          href="/dashboard/validations"
        />
        <StatsCard
          title="Avg Risk Score"
          value={`${stats.avg_risk_score ?? 0}%`}
          icon={<TrendingUp size={20} />}
          trend={-5}
          trendLabel="Lower is better"
        />
      </motion.div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Would fetch from GET /analytics/validation-history */}
        <motion.div 
          className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-zinc-950/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-white">Validation Trend</h3>
              <p className="text-sm text-zinc-500">Weekly overview</p>
            </div>
            <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-400 focus:outline-none focus:border-zinc-700">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          
          <div className="h-64 min-h-[256px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="mx-auto mb-2 text-zinc-600" size={32} />
                  <p className="text-zinc-500 text-sm">No data available</p>
                  <p className="text-zinc-600 text-xs">Start validating to see trends</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Validations - Fetches from GET /validations */}
        <motion.div 
          className="p-6 rounded-xl border border-white/10 bg-zinc-950/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Recent Activity</h3>
            <Link href="/dashboard/validations" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              View all
            </Link>
          </div>
          
          <div className="space-y-1">
            {validationsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-zinc-800 rounded mb-1" />
                      <div className="h-3 w-20 bg-zinc-800/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : validationsData?.validations?.length ? (
              validationsData.validations.map((validation) => (
                <RecentValidationItem key={validation.id} validation={validation} />
              ))
            ) : (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-2 text-zinc-600" size={32} />
                <p className="text-zinc-500 text-sm">No validations yet</p>
                <Link
                  href="/dashboard/validations"
                  className="text-sm text-violet-400 hover:underline mt-2 inline-block"
                >
                  Create your first validation
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
