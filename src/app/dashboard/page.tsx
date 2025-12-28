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
  BarChart3,
  Zap
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
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

// Sample chart data - would come from API in production
const chartData = [
  { name: 'Feb', value: 65 },
  { name: 'Mar', value: 78 },
  { name: 'Apr', value: 82 },
  { name: 'May', value: 95 },
  { name: 'Jun', value: 88 },
  { name: 'Jul', value: 72 },
  { name: 'Aug', value: 85 },
  { name: 'Sep', value: 91 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  href?: string;
  accentColor?: 'violet' | 'mint';
}

function StatCard({ title, value, icon, subtitle, trend, trendLabel, href, accentColor = 'violet' }: StatCardProps) {
  const content = (
    <div className="glass-dark rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
        accentColor === 'violet' ? "bg-violet" : "bg-mint"
      )} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4",
            accentColor === 'violet' ? "bg-violet/20 text-violet" : "bg-mint/20 text-mint"
          )}>
            {icon}
          </div>
          <p className="text-sm text-white/60 font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <span className="text-sm text-white/40">- {subtitle}</span>
            )}
          </div>
          {trendLabel && (
            <p className="text-xs text-white/50 mt-2">{trendLabel}</p>
          )}
        </div>
        
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend >= 0 
              ? "bg-mint/20 text-mint" 
              : "bg-red-500/20 text-red-400"
          )}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

// Glass Tooltip for Charts
function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="glass-dark rounded-xl px-4 py-3 border border-white/10">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{payload[0].value}</p>
    </div>
  );
}

// Gauge Component for Risk Score
function RiskGauge({ score }: { score: number }) {
  const rotation = (score / 100) * 180 - 90;
  const getColor = () => {
    if (score <= 30) return '#34d399'; // mint/green
    if (score <= 60) return '#fbbf24'; // yellow
    return '#f87171'; // red
  };

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Background arc */}
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 126} 126`}
        />
      </svg>
      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-1 h-16 bg-white rounded-full origin-bottom shadow-lg"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />
      {/* Center dot */}
      <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 bg-white rounded-full shadow-lg" />
      {/* Score display */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <span className="text-3xl font-bold text-white">{score}%</span>
      </div>
    </div>
  );
}

function RecentValidationItem({ validation }: { validation: Validation }) {
  const statusConfig = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    completed: { bg: 'bg-mint/20', text: 'text-mint', dot: 'bg-mint' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  };

  const status = statusConfig[validation.status];

  return (
    <Link
      href={`/dashboard/validations/${validation.id}`}
      className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl", status.bg)}>
          <CheckCircle size={18} className={status.text} />
        </div>
        <div>
          <p className="font-medium text-white group-hover:text-violet transition-colors">
            {validation.dataset_name || 'Dataset'}
          </p>
          <p className="text-sm text-white/50">{validation.validation_type}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {validation.results?.risk_score !== undefined && (
          <div className="text-right">
            <p className="text-sm text-white/50">Risk Score</p>
            <p className="font-semibold text-white">{validation.results.risk_score}%</p>
          </div>
        )}
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full capitalize",
          status.bg, status.text
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          {validation.status}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardOverview() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: analyticsApi.getUsage,
  });

  const { data: validationsData, isLoading: validationsLoading } = useQuery({
    queryKey: ['validations', 'recent'],
    queryFn: () => validationsApi.list(1, 5),
  });

  if (analyticsLoading) {
    return <DashboardSkeleton />;
  }

  const stats: UsageAnalytics = analytics || {
    total_rows_validated: 0,
    total_datasets: 0,
    total_validations: 0,
    active_jobs: 0,
    avg_risk_score: 0,
    validations_this_month: 0,
    rows_this_month: 0,
  };

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{greeting}</h1>
        <p className="text-white/50 flex items-center gap-2">
          Your AI validation update
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint glow-mint" />
        </p>
      </div>

      {/* Stats Grid - Neumorphic/Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ready to assign"
          value={stats.total_rows_validated.toLocaleString()}
          subtitle={stats.total_datasets.toString()}
          icon={<Database size={22} />}
          trend={42}
          trendLabel={`${stats.rows_this_month.toLocaleString()} rows this week`}
          href="/dashboard/datasets"
          accentColor="violet"
        />
        <StatCard
          title="Pending sign offs"
          value={stats.active_jobs}
          subtitle={stats.validations_this_month.toString()}
          icon={<Activity size={22} />}
          trend={22}
          trendLabel="Signed off this week"
          href="/dashboard/validations"
          accentColor="mint"
        />
        <StatCard
          title="Avg Risk Score"
          value={`${stats.avg_risk_score}%`}
          icon={<TrendingUp size={22} />}
          trend={-5}
          trendLabel="Lower is better"
          accentColor="violet"
        />
        <StatCard
          title="Total Validations"
          value={stats.total_validations}
          subtitle={stats.validations_this_month.toString()}
          icon={<CheckCircle size={22} />}
          trend={5}
          trendLabel={`${stats.validations_this_month} this month`}
          href="/dashboard/validations"
          accentColor="mint"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Invoice/Bar Chart Style */}
        <div className="lg:col-span-2 glass-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Validation Trend</h3>
              <p className="text-sm text-white/50">Monthly overview</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/70">
                Mar 2024
              </span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar 
                  dataKey="value" 
                  fill="#6c5ce7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Gauge Card */}
        <div className="glass-dark rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-violet/20">
              <BarChart3 size={20} className="text-violet" />
            </div>
            <div className="flex items-center gap-1 text-mint text-sm">
              <Zap size={14} />
              <span>85%</span>
            </div>
          </div>
          
          <h3 className="text-white/60 text-sm mb-1">Amount Owed</h3>
          <p className="text-3xl font-bold text-white mb-1">
            ${stats.total_rows_validated.toLocaleString()}.45
          </p>
          <p className="text-sm text-mint mb-6">
            ${stats.rows_this_month.toLocaleString()}.89
          </p>
          
          <div className="flex-1 flex items-center justify-center">
            <RiskGauge score={stats.avg_risk_score || 45} />
          </div>
        </div>
      </div>

      {/* Recent Validations - Glass Effect */}
      <div className="glass-dark rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">History</h2>
            <p className="text-sm text-white/50">Recent validation jobs</p>
          </div>
          <Link
            href="/dashboard/validations"
            className="text-sm text-violet hover:text-violet/80 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {validationsLoading ? (
            <div className="p-8 text-center text-white/50">
              Loading validations...
            </div>
          ) : validationsData?.validations?.length ? (
            validationsData.validations.map((validation) => (
              <RecentValidationItem key={validation.id} validation={validation} />
            ))
          ) : (
            <div className="p-8 text-center">
              <Clock className="mx-auto mb-2 text-white/30" size={32} />
              <p className="text-white/50">No validations yet</p>
              <Link
                href="/dashboard/validations"
                className="text-sm text-violet hover:underline mt-2 inline-block"
              >
                Create your first validation
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-white/10 rounded-lg" />
        <div className="h-4 w-64 bg-white/5 rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-dark rounded-2xl p-6">
            <div className="h-12 w-12 bg-white/10 rounded-xl mb-4" />
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-8 w-20 bg-white/5 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-dark rounded-2xl p-6 h-80" />
        <div className="glass-dark rounded-2xl p-6 h-80" />
      </div>
    </div>
  );
}
