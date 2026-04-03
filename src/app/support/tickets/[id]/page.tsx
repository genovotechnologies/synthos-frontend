'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

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

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent'] as const;

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [assignTo, setAssignTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support', 'ticket', resolvedParams.id],
    queryFn: () => supportApi.getTicket(resolvedParams.id),
    retry: 1,
  });

  const replyMutation = useMutation({
    mutationFn: () => supportApi.replyToTicket(resolvedParams.id, replyMessage, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', resolvedParams.id] });
      setReplyMessage('');
      setIsInternal(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => supportApi.updateTicketStatus(resolvedParams.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support', 'ticket', resolvedParams.id] }),
  });

  const priorityMutation = useMutation({
    mutationFn: (priority: string) => supportApi.updateTicketPriority(resolvedParams.id, priority),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support', 'ticket', resolvedParams.id] }),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => supportApi.assignTicket(resolvedParams.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', resolvedParams.id] });
      setAssignTo('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  const ticket = data?.ticket;
  const messages = data?.messages ?? [];

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link href="/support/tickets" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={14} /> Back to tickets
        </Link>
        <p className="text-sm text-zinc-500">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/support/tickets" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Back to tickets
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <header className="space-y-3">
            <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">{ticket.subject}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusPill[ticket.status])}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', priorityPill[ticket.priority])}>
                {ticket.priority}
              </span>
              {ticket.assignee_name && (
                <span className="text-xs text-zinc-500">Assigned to {ticket.assignee_name}</span>
              )}
            </div>
          </header>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-2">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Customer</p>
            <p className="text-sm text-zinc-300">{ticket.user_name || 'Unknown'}</p>
            <p className="text-sm text-zinc-500">{ticket.user_email || '—'}</p>
            <p className="text-xs text-zinc-600">Ticket created {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Messages</p>
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-600">No messages yet</p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isSupport = msg.sender_role === 'support' || msg.sender_role === 'admin';
                  const isInternalNote = msg.is_internal;
                  return (
                    <div key={msg.id} className={cn('max-w-[85%]', isSupport ? 'ml-auto' : '')}>
                      <div className={cn(
                        'rounded-xl px-4 py-3',
                        isInternalNote
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : isSupport
                            ? 'bg-violet-500/10 border border-violet-500/20'
                            : 'bg-zinc-900 border border-zinc-800/50'
                      )}>
                        {isInternalNote && (
                          <p className="text-[10px] font-medium text-amber-400 uppercase tracking-wider mb-1">Internal Note</p>
                        )}
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className={cn('flex items-center gap-2 mt-1.5 px-1', isSupport ? 'justify-end' : '')}>
                        <span className="text-xs text-zinc-600">{msg.sender_name || 'Unknown'}</span>
                        <span className="text-xs text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600 tabular-nums">
                          {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-4">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={isInternal ? 'Write an internal note...' : 'Type your reply...'}
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-zinc-500">Internal note</span>
              </label>
              <button
                onClick={() => replyMutation.mutate()}
                disabled={!replyMessage.trim() || replyMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {replyMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-64 space-y-5">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                disabled={statusMutation.isPending}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Priority</label>
              <select
                value={ticket.priority}
                onChange={(e) => priorityMutation.mutate(e.target.value)}
                disabled={priorityMutation.isPending}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-zinc-900">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Assign To</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  placeholder="User ID"
                  className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
                />
                <button
                  onClick={() => assignTo && assignMutation.mutate(assignTo)}
                  disabled={!assignTo || assignMutation.isPending}
                  className="px-3 py-2 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
