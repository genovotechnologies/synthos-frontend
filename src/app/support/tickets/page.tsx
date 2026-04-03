'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['all', 'low', 'normal', 'high', 'urgent'] as const;

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

export default function SupportTicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['support', 'tickets', page, statusFilter, priorityFilter],
    queryFn: () => supportApi.listTickets(
      page, 20,
      statusFilter !== 'all' ? statusFilter : undefined,
      priorityFilter !== 'all' ? priorityFilter : undefined
    ),
    retry: 1,
  });

  const tickets = data?.tickets ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Ticket Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and respond to customer support tickets</p>
      </header>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-zinc-900">
              {s === 'all' ? 'All Status' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p} className="bg-zinc-900">
              {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50">
          <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Assigned</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>
          {tickets.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600">No tickets found</div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center group"
              >
                <div className="col-span-4">
                  <span className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{ticket.subject}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-zinc-500 truncate">{ticket.user_name || ticket.user_email || '—'}</span>
                </div>
                <div className="col-span-1">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', priorityPill[ticket.priority])}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusPill[ticket.status])}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-zinc-500 truncate">{ticket.assignee_name || '—'}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm text-zinc-500 tabular-nums">
                    {new Date(ticket.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-zinc-600">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total} tickets)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-md border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 rounded-md border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
