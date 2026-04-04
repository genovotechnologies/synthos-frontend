'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, Trash2, ShieldAlert, UserCheck, UserX } from 'lucide-react';

const rolePillClass: Record<string, string> = {
  admin: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  developer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  support: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  user: 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
};

const ROLES = ['admin', 'developer', 'support', 'user'] as const;

type TabType = 'datasets' | 'validations' | 'tickets';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('datasets');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminApi.getUserDetail(id),
  });

  const roleMutation = useMutation({
    mutationFn: (role: string) => adminApi.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => adminApi.updateUserStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(id),
    onSuccess: () => router.push('/admin/users'),
  });

  const handleRoleChange = (newRole: string) => {
    if (confirm(`Change role to ${newRole}?`)) {
      roleMutation.mutate(newRole);
    }
  };

  const handleToggleStatus = () => {
    if (!user) return;
    const action = user.is_active ? 'suspend' : 'reactivate';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      statusMutation.mutate(!user.is_active);
    }
  };

  const handleDelete = () => {
    if (user && deleteConfirmEmail === user.email) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={14} />
          Back to Users
        </Link>
        <div className="text-center py-20 text-sm text-zinc-500">User not found or failed to load.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} />
        Back to Users
      </Link>

      {/* Profile Header */}
      <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/80 flex items-center justify-center text-xl font-semibold text-zinc-300 shrink-0">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">{user.full_name}</h1>
              <span className={cn('text-[11px] font-medium px-2.5 py-0.5 rounded-full border', rolePillClass[user.role] || rolePillClass.user)}>
                {user.role}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-rose-500')} />
                <span className={cn('text-xs', user.is_active ? 'text-emerald-400' : 'text-rose-400')}>
                  {user.is_active ? 'Active' : 'Suspended'}
                </span>
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
              <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {user.last_login_at && (
                <span>Last login {new Date(user.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-500">Role:</label>
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={roleMutation.isPending}
            className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-zinc-900">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleToggleStatus}
          disabled={statusMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg border transition-colors',
            user.is_active
              ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
          )}
        >
          {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          {statusMutation.isPending ? 'Updating...' : user.is_active ? 'Suspend' : 'Activate'}
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
        >
          <Trash2 size={14} />
          Delete User
        </button>
      </div>

      {/* Credit Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Credit Balance</p>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{user.credit_balance?.toLocaleString() ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Total Validations</p>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{user.total_validations?.toLocaleString() ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Total Datasets</p>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{user.total_datasets?.toLocaleString() ?? 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-zinc-800/50">
          {(['datasets', 'validations', 'tickets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'text-zinc-100 border-rose-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'datasets' && <UserDatasetsTab userId={id} />}
          {activeTab === 'validations' && <UserValidationsTab userId={id} />}
          {activeTab === 'tickets' && <UserTicketsTab userId={id} />}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-sm font-medium text-zinc-100">Delete User</h3>
            </div>
            <p className="text-sm text-zinc-400">
              This action cannot be undone. Type <span className="text-zinc-200 font-mono">{user.email}</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder="Type email to confirm"
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmEmail(''); }}
                className="flex-1 px-4 py-2 text-sm text-zinc-400 border border-zinc-800 rounded-lg hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmEmail !== user.email || deleteMutation.isPending}
                className="flex-1 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDatasetsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-datasets', userId],
    queryFn: () => adminApi.listAllDatasets(1, 100),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-zinc-600" /></div>;

  const datasets = (data?.datasets ?? []).filter((d: any) => d.user_id === userId || !d.user_id);

  if (datasets.length === 0) return <p className="text-sm text-zinc-600 text-center py-8">No datasets found</p>;

  return (
    <div className="space-y-2">
      {datasets.slice(0, 20).map((d: any) => (
        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/20 border border-zinc-800/30">
          <div>
            <p className="text-sm text-zinc-300">{d.name || d.file_name}</p>
            <p className="text-xs text-zinc-600">{d.row_count?.toLocaleString()} rows &middot; {(d.file_size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <span className={cn(
            'text-[11px] px-2 py-0.5 rounded-full',
            d.status === 'ready' ? 'bg-emerald-500/15 text-emerald-400' :
            d.status === 'error' ? 'bg-rose-500/15 text-rose-400' :
            'bg-amber-500/15 text-amber-400'
          )}>{d.status}</span>
        </div>
      ))}
    </div>
  );
}

function UserValidationsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-validations', userId],
    queryFn: () => adminApi.listAllValidations(1, 100),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-zinc-600" /></div>;

  const validations = (data?.validations ?? []).filter((v: any) => v.user_id === userId || !v.user_id);

  if (validations.length === 0) return <p className="text-sm text-zinc-600 text-center py-8">No validations found</p>;

  return (
    <div className="space-y-2">
      {validations.slice(0, 20).map((v: any) => (
        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/20 border border-zinc-800/30">
          <div>
            <p className="text-sm text-zinc-300">{v.dataset_name || v.validation_type}</p>
            <p className="text-xs text-zinc-600">{v.validation_type} &middot; {new Date(v.created_at).toLocaleDateString()}</p>
          </div>
          <span className={cn(
            'text-[11px] px-2 py-0.5 rounded-full',
            v.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
            v.status === 'failed' ? 'bg-rose-500/15 text-rose-400' :
            v.status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
            'bg-amber-500/15 text-amber-400'
          )}>{v.status}</span>
        </div>
      ))}
    </div>
  );
}

function UserTicketsTab({ userId }: { userId: string }) {
  return (
    <p className="text-sm text-zinc-600 text-center py-8">
      Support tickets for this user will appear here when the endpoint is available.
    </p>
  );
}
