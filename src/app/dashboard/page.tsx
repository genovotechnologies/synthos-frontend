'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, validationsApi, type UsageAnalytics, type Validation } from '@/lib/api';
import { 
  Database, 
  CheckCircle, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  href?: string;
}

function StatCard({ title, value, icon, trend, trendUp, href }: StatCardProps) {
  const content = (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center gap-1",
              trendUp ? "text-green-500" : "text-muted-foreground"
            )}>
              {trendUp && <ArrowUpRight size={14} />}
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function RecentValidationItem({ validation }: { validation: Validation }) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    processing: 'bg-blue-500/10 text-blue-500',
    completed: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
  };

  return (
    <Link
      href={`/dashboard/validations/${validation.id}`}
      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-md", statusColors[validation.status])}>
          <CheckCircle size={16} />
        </div>
        <div>
          <p className="font-medium">{validation.dataset_name || 'Dataset'}</p>
          <p className="text-sm text-muted-foreground">{validation.validation_type}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full capitalize",
          statusColors[validation.status]
        )}>
          {validation.status}
        </span>
        {validation.results?.risk_score !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            Risk: {validation.results.risk_score}%
          </p>
        )}
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI data validation platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rows Validated"
          value={stats.total_rows_validated.toLocaleString()}
          icon={<Database size={24} />}
          trend={`${stats.rows_this_month.toLocaleString()} this month`}
          trendUp
          href="/dashboard/datasets"
        />
        <StatCard
          title="Active Jobs"
          value={stats.active_jobs}
          icon={<Activity size={24} />}
          href="/dashboard/validations"
        />
        <StatCard
          title="Avg Risk Score"
          value={`${stats.avg_risk_score}%`}
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          title="Total Validations"
          value={stats.total_validations}
          icon={<CheckCircle size={24} />}
          trend={`${stats.validations_this_month} this month`}
          trendUp
          href="/dashboard/validations"
        />
      </div>

      {/* Recent Validations */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Validations</h2>
            <p className="text-sm text-muted-foreground">Latest validation jobs</p>
          </div>
          <Link
            href="/dashboard/validations"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {validationsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading validations...
            </div>
          ) : validationsData?.validations?.length ? (
            validationsData.validations.map((validation) => (
              <RecentValidationItem key={validation.id} validation={validation} />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2" size={24} />
              <p>No validations yet</p>
              <Link
                href="/dashboard/validations"
                className="text-sm text-primary hover:underline mt-2 inline-block"
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
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="space-y-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
