'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { Plus, X, Loader2, Send, Trash2 } from 'lucide-react';

const INVITE_ROLES = ['admin', 'developer', 'support'] as const;

const statusPill: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  expired: 'bg-zinc-800 text-zinc-500',
  revoked: 'bg-rose-500/15 text-rose-400',
};

export default function AdminInvitesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('developer');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: adminApi.listInvites,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createInvite(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      setShowForm(false);
      setEmail('');
      setRole('developer');
    },
  });

  const invites = data?.invites ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Team Invites</h1>
          <p className="text-sm text-zinc-500 mt-1">Invite new team members to the platform</p>
        </header>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Invite Team Member'}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 space-y-5">
          <p className="text-sm font-medium text-zinc-300">Send Invite</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="team@company.com"
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div className="w-40">
              <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                {INVITE_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-zinc-900">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!email || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
            {createMutation.isPending ? 'Sending...' : 'Send Invite'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-rose-400">Failed to send invite. Please try again.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50">
          <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Sent By</div>
            <div className="col-span-1">Expires</div>
            <div className="col-span-1 text-right">Created</div>
            <div className="col-span-1 text-right"></div>
          </div>
          {invites.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600">No invites sent yet</div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center">
                <div className="col-span-3">
                  <span className="text-sm text-zinc-300 truncate">{invite.email}</span>
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
                    invite.role === 'admin' ? 'bg-rose-500/15 text-rose-400' :
                    invite.role === 'developer' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-amber-500/15 text-amber-400'
                  )}>
                    {invite.role}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
                    statusPill[invite.status] || statusPill.pending
                  )}>
                    {invite.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-zinc-500 truncate">{invite.invited_by || '—'}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-zinc-500 tabular-nums">
                    {new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-sm text-zinc-500 tabular-nums">
                    {new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(`Delete invite for ${invite.email}?`)) {
                        adminApi.deleteInvite(invite.id).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
                        });
                      }
                    }}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors"
                    title="Delete invite"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
