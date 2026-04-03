'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/tickets';
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

export default function CustomerTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'detail', resolvedParams.id],
    queryFn: () => ticketsApi.get(resolvedParams.id),
    retry: 1,
  });

  const replyMutation = useMutation({
    mutationFn: () => ticketsApi.reply(resolvedParams.id, replyMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', resolvedParams.id] });
      setReplyMessage('');
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
  const messages = (data?.messages ?? []).filter((m) => !m.is_internal);

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/help" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={14} /> Back to Help
        </Link>
        <p className="text-sm text-zinc-500">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/dashboard/help" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Back to Help
      </Link>

      <header className="space-y-3">
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">{ticket.subject}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', statusPill[ticket.status])}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', priorityPill[ticket.priority])}>
            {ticket.priority}
          </span>
          <span className="text-xs text-zinc-600">
            Created {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </header>

      <div className="space-y-4">
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Messages</p>
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-600">No messages yet</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isSupport = msg.sender_role === 'support' || msg.sender_role === 'admin';
              return (
                <div key={msg.id} className={cn('max-w-[85%]', isSupport ? 'ml-auto' : '')}>
                  <div className={cn(
                    'rounded-xl px-4 py-3',
                    isSupport
                      ? 'bg-violet-500/10 border border-violet-500/20'
                      : 'bg-zinc-900 border border-zinc-800/50'
                  )}>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <div className={cn('flex items-center gap-2 mt-1.5 px-1', isSupport ? 'justify-end' : '')}>
                    <span className="text-xs text-zinc-600">{msg.sender_name || (isSupport ? 'Support' : 'You')}</span>
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
          placeholder="Type your reply..."
          rows={4}
          className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!replyMessage.trim() || replyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
            {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
