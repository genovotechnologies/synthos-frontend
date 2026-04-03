'use client';

import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const priorityPill: Record<string, string> = {
  low: 'bg-zinc-800 text-zinc-400',
  normal: 'bg-blue-500/15 text-blue-400',
  high: 'bg-amber-500/15 text-amber-400',
  urgent: 'bg-rose-500/15 text-rose-400',
};

const statusPill: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  waiting: 'bg-zinc-800 text-zinc-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
  closed: 'bg-zinc-800 text-zinc-500',
};

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

export default function SupportOverviewPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['support', 'overview'],
    queryFn: supportApi.getOverview,
    retry: 1,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support', 'tickets', 'recent'],
    queryFn: () => supportApi.listTickets(1, 5),
    retry: 1,
  });

  if (overviewLoading) return <Skeleton />;

  const stats = [
    { label: 'Open Tickets', value: overview?.open_tickets ?? 0 },
    { label: 'In Progress', value: overview?.in_progress_tickets ?? 0 },
    { label: 'Resolved Today', value: overview?.resolved_today ?? 0 },
    { label: 'Avg Response Time', value: `${(overview?.avg_response_time_hours ?? 0).toFixed(1)}h` },
  ];

  const tickets = ticketsData?.tickets ?? [];

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Support Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Ticket queue and support performance metrics</p>
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

      <section>
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Recent Tickets</p>
          <Link href="/support/tickets" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all tickets →</Link>
        </div>
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-zinc-600 py-8 text-center">No tickets yet</p>
        ) : (
          <div className="space-y-1">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-zinc-900/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{ticket.subject}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{ticket.user_name || ticket.user_email || 'Unknown user'}</p>
                </div>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', priorityPill[ticket.priority])}>
                  {ticket.priority}
                </span>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusPill[ticket.status])}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-600 tabular-nums">
                  {new Date(ticket.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
