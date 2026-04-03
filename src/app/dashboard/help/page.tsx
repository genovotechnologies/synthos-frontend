'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Send, Loader2 } from 'lucide-react';

const CATEGORIES = ['general', 'billing', 'technical', 'account', 'data'] as const;

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

export default function DashboardHelpPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'my'],
    queryFn: () => ticketsApi.list(1),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: () => ticketsApi.create(subject, message, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'my'] });
      setSubject('');
      setCategory('general');
      setMessage('');
    },
  });

  const tickets = data?.tickets ?? [];

  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Help & Support</h1>
        <p className="text-sm text-zinc-500 mt-1">Submit a support ticket or view your existing requests</p>
      </header>

      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">Submit a Ticket</p>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!subject || !message || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
            {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
          {createMutation.isSuccess && (
            <p className="text-sm text-emerald-400">Ticket submitted successfully.</p>
          )}
          {createMutation.isError && (
            <p className="text-sm text-rose-400">Failed to submit ticket. Please try again.</p>
          )}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-6">My Tickets</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-zinc-600 py-8 text-center">No tickets yet</p>
        ) : (
          <div className="border-t border-zinc-800/50">
            <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
              <div className="col-span-5">Subject</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-3 text-right">Created</div>
            </div>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/help/${ticket.id}`}
                className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center group"
              >
                <div className="col-span-5">
                  <span className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{ticket.subject}</span>
                </div>
                <div className="col-span-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusPill[ticket.status])}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', priorityPill[ticket.priority])}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm text-zinc-500 tabular-nums">
                    {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
