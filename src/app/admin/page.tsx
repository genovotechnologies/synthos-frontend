'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Users, Tag, ArrowRight } from 'lucide-react';

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
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
    retry: 1,
  });

  if (isLoading) return <Skeleton />;

  const stats = [
    { label: 'Total Users', value: data?.total_users ?? 0 },
    { label: 'Total Validations', value: data?.total_validations ?? 0 },
    { label: 'Total Datasets', value: data?.total_datasets ?? 0 },
    { label: 'Revenue', value: `$${((data?.total_revenue_cents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  ];

  const roleEntries = Object.entries(data?.users_by_role ?? {});

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">System-wide metrics and administration</p>
      </header>

      <section>
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
      </section>

      {roleEntries.length > 0 && (
        <section>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Users by Role</p>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/users" className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-rose-400" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Manage Users</span>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
          <Link href="/admin/promo-codes" className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-rose-400" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Promo Codes</span>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
        </div>
      </section>
    </div>
  );
}
