'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';

const ROLES = ['all', 'admin', 'developer', 'support', 'user'] as const;
const STATUSES = ['all', 'active', 'suspended'] as const;

const rolePillClass: Record<string, string> = {
  admin: 'bg-rose-500/15 text-rose-400',
  developer: 'bg-blue-500/15 text-blue-400',
  support: 'bg-amber-500/15 text-amber-400',
  user: 'bg-zinc-800 text-zinc-400',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<{ type: 'role' | 'status' | 'delete'; userId: string; value: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, statusFilter],
    queryFn: () => adminApi.listUsers(
      page, 20,
      search || undefined,
      roleFilter !== 'all' ? roleFilter : undefined,
      statusFilter !== 'all' ? statusFilter : undefined
    ),
    retry: 1,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setConfirmAction(null); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateUserStatus(id, isActive),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setConfirmAction(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setConfirmAction(null); },
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">User Management</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage platform users, roles, and access</p>
      </header>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 flex-1 max-w-sm">
          <Search size={14} className="text-zinc-600" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
          >
            {ROLES.map((r) => <option key={r} value={r} className="bg-zinc-900">{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s} value={s} className="bg-zinc-900">{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="border-t border-zinc-800/50">
          <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-medium text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Created</div>
            <div className="col-span-1 text-right"></div>
          </div>
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600">No users found</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 py-3.5 border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors items-center group">
                <Link href={`/admin/users/${user.id}`} className="col-span-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-xs font-medium text-zinc-400">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-zinc-300 truncate hover:text-zinc-100">{user.full_name}</span>
                </Link>
                <Link href={`/admin/users/${user.id}`} className="col-span-3">
                  <span className="text-sm text-zinc-500 truncate">{user.email}</span>
                </Link>
                <div className="col-span-2">
                  <select
                    value={user.role}
                    onChange={(e) => setConfirmAction({ type: 'role', userId: user.id, value: e.target.value })}
                    className={cn(
                      'text-[11px] font-medium px-2 py-0.5 rounded-full border-0 focus:outline-none cursor-pointer appearance-none',
                      rolePillClass[user.role] || rolePillClass.user
                    )}
                  >
                    {ROLES.filter(r => r !== 'all').map((r) => (
                      <option key={r} value={r} className="bg-zinc-900 text-zinc-300">{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => setConfirmAction({ type: 'status', userId: user.id, value: user.is_active ? 'suspend' : 'reactivate' })}
                    className="flex items-center gap-2 group"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-rose-500')} />
                    <span className={cn('text-sm', user.is_active ? 'text-emerald-400' : 'text-rose-400')}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </button>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-sm text-zinc-500 tabular-nums">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', userId: user.id, value: user.email })}
                    className="p-1.5 rounded-md text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-zinc-600">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total} users)
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

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-zinc-100">Confirm Action</h3>
            <p className="text-sm text-zinc-400">
              {confirmAction.type === 'role'
                ? `Change this user's role to "${confirmAction.value}"?`
                : confirmAction.type === 'delete'
                  ? `Permanently delete user "${confirmAction.value}"? This action cannot be undone.`
                  : confirmAction.value === 'suspend'
                    ? 'Suspend this user? They will lose access to the platform.'
                    : 'Reactivate this user? They will regain access to the platform.'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 text-sm text-zinc-400 border border-zinc-800 rounded-lg hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'role') {
                    roleMutation.mutate({ id: confirmAction.userId, role: confirmAction.value });
                  } else if (confirmAction.type === 'delete') {
                    deleteMutation.mutate(confirmAction.userId);
                  } else {
                    statusMutation.mutate({ id: confirmAction.userId, isActive: confirmAction.value === 'reactivate' });
                  }
                }}
                disabled={roleMutation.isPending || statusMutation.isPending || deleteMutation.isPending}
                className="flex-1 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50 transition-colors"
              >
                {roleMutation.isPending || statusMutation.isPending || deleteMutation.isPending ? 'Processing...' : confirmAction.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
