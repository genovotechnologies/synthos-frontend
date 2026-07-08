'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Key, Bell, Eye, EyeOff, Copy, Check, AlertCircle, Loader2, Globe, Trash2, ChevronDown, ChevronUp, Monitor, Smartphone, X, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { authApi, type NotificationPreferences, webhooksApi, apiKeysApi, platformApi, type ApiKeySummary } from '@/lib/api';
import apiClient from '@/lib/api/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type TabType = 'profile' | 'security' | 'notifications' | 'api' | 'webhooks';

/** Map a `?tab=` value to a tab key; `password` is an alias for `security`. */
function resolveTab(value: string | null): TabType | null {
  if (!value) return null;
  if (value === 'password') return 'security';
  const valid: TabType[] = ['profile', 'security', 'notifications', 'api', 'webhooks'];
  return valid.includes(value as TabType) ? (value as TabType) : null;
}

function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || '');
      setCompany(user.company || '');
      setRole(user.role || '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully');
      checkAuth(); // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({ name, company, role });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-white mb-1">Profile Information</h3>
        <p className="text-sm text-zinc-500">Update your account profile details.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {updateProfileMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to update profile. Please try again.</span>
        </div>
      )}

      <div className="grid gap-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2.5 bg-zinc-900/30 border border-white/[0.06] rounded-lg text-zinc-500 cursor-not-allowed"
          />
          <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
            placeholder="Your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
            placeholder="Your role"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="w-fit px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}

interface Session {
  id: string;
  user_agent: string;
  ip_address: string;
  last_used_at: string;
  is_current: boolean;
  created_at: string;
}

function parseUserAgent(ua: string): { device: string; icon: typeof Monitor } {
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    return { device: 'Mobile Device', icon: Smartphone };
  }
  if (/chrome/i.test(ua)) return { device: 'Chrome Browser', icon: Monitor };
  if (/firefox/i.test(ua)) return { device: 'Firefox Browser', icon: Monitor };
  if (/safari/i.test(ua)) return { device: 'Safari Browser', icon: Monitor };
  if (/edge/i.test(ua)) return { device: 'Edge Browser', icon: Monitor };
  return { device: 'Unknown Device', icon: Monitor };
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setSuccessMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleChangePassword = () => {
    setValidationError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError('All fields are required');
      return;
    }
    
    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setValidationError('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-white mb-1">Security Settings</h3>
        <p className="text-sm text-zinc-500">Manage your password and security preferences.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {(validationError || changePasswordMutation.isError) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            {validationError || 'Failed to change password. Check your current password and try again.'}
          </span>
        </div>
      )}

      <div className="grid gap-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changePasswordMutation.isPending}
          className="w-fit px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </div>

      {/* Active Sessions */}
      <ActiveSessions />
    </div>
  );
}

function ActiveSessions() {
  const queryClient = useQueryClient();
  const [sessionSuccess, setSessionSuccess] = useState('');

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ sessions: Session[] }>('/auth/sessions');
      return data;
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
    },
    onSuccess: () => {
      setSessionSuccess('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setTimeout(() => setSessionSuccess(''), 3000);
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete('/auth/sessions');
    },
    onSuccess: () => {
      setSessionSuccess('All other sessions revoked');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setTimeout(() => setSessionSuccess(''), 3000);
    },
  });

  return (
    <div className="pt-8 border-t border-white/[0.06]">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-1">Active Sessions</h3>
        <p className="text-sm text-zinc-500">Manage your active sessions across devices.</p>
      </div>

      {sessionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
          <Check className="w-4 h-4" />
          <span className="text-sm">{sessionSuccess}</span>
        </div>
      )}

      {sessionsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {sessionsData?.sessions?.map((session) => {
            const { device, icon: DeviceIcon } = parseUserAgent(session.user_agent);
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/40"
              >
                <div className="flex items-center gap-3">
                  <DeviceIcon className="w-5 h-5 text-zinc-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{device}</span>
                      {session.is_current && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">{session.ip_address}</span>
                      <span className="text-xs text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{timeAgo(session.last_used_at)}</span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                    disabled={revokeSessionMutation.isPending}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}

          {sessionsData?.sessions && sessionsData.sessions.length > 1 && (
            <button
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="w-full mt-4 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {revokeAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Revoke All Other Sessions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationSettings() {
  const [successMessage, setSuccessMessage] = useState('');
  
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: authApi.getNotificationPreferences,
  });

  const [settings, setSettings] = useState<NotificationPreferences>({
    email_notifications: true,
    validation_complete: true,
    warranty_expiring: true,
    weekly_digest: false,
    ticket_updates: true,
  });

  useEffect(() => {
    if (preferences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(preferences);
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: authApi.updateNotificationPreferences,
    onSuccess: () => {
      setSuccessMessage('Notification preferences saved');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updatePreferencesMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const notificationOptions = [
    {
      key: 'email_notifications' as const,
      title: 'Email Notifications',
      description: 'Receive email notifications for important updates',
    },
    {
      key: 'validation_complete' as const,
      title: 'Validation Complete',
      description: 'Get notified when data validation finishes',
    },
    {
      key: 'warranty_expiring' as const,
      title: 'Warranty Expiring',
      description: 'Alert when warranties are about to expire',
    },
    {
      key: 'weekly_digest' as const,
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of your activity',
    },
    {
      key: 'ticket_updates' as const,
      title: 'Ticket updates',
      description: 'Replies to your support tickets',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-white mb-1">Notification Preferences</h3>
        <p className="text-sm text-zinc-500">Choose what notifications you want to receive.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {updatePreferencesMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to save preferences. Please try again.</span>
        </div>
      )}

      <div className="space-y-1">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-white">{option.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
            </div>
            <Switch
              checked={settings[option.key]}
              onChange={() => handleToggle(option.key)}
              disabled={updatePreferencesMutation.isPending}
              label={option.title}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSettings() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<ApiKeySummary | null>(null);
  // Full key returned once at creation time; never persisted by the backend.
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => apiKeysApi.create(name),
    onSuccess: (data, name) => {
      setNewKey({ name, key: data.key });
      setShowNewKey(false);
      setCreating(false);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key created', 'Copy it now — it will not be shown again.');
    },
    onError: (err: Error) => toast.error('Failed to create API key', err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: (err: Error) => toast.error('Failed to revoke key', err.message),
  });

  const handleCopy = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Could not copy to clipboard'));
  };

  const formatKeyDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">API Keys</h3>
          <p className="text-sm text-zinc-500">Create named keys for each integration so they can be revoked independently.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New key
        </button>
      </div>

      {/* One-time full key reveal */}
      {newKey && (
        <div className="panel p-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            &ldquo;{newKey.name}&rdquo; — copy your key now
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={showNewKey ? newKey.key : '•'.repeat(Math.min(newKey.key.length, 40))}
                readOnly
                className="w-full px-4 py-2.5 pr-10 bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg text-white font-mono text-sm"
              />
              <button
                onClick={() => setShowNewKey(!showNewKey)}
                aria-label={showNewKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copy API key"
              className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-amber-400/90 mt-2">
            This is the only time the full key is shown. Store it securely, then dismiss this notice.
          </p>
          <button onClick={() => setNewKey(null)} className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors">
            I&apos;ve stored it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="panel p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="key-name" className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Key name
            </label>
            <input
              id="key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. ci-pipeline, staging"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-violet-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCreating(false); setNewKeyName(''); }}
              className="px-3.5 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(newKeyName.trim())}
              disabled={!newKeyName.trim() || createMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading keys…
        </div>
      ) : !keys || keys.length === 0 ? (
        <div className="panel px-4 py-8 text-center">
          <Key className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-300">No API keys</p>
          <p className="text-xs text-zinc-600 mt-1">Create a key to access the Synthos API programmatically.</p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-4 py-3">
                <Key className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{k.name || 'Unnamed key'}</p>
                  <p className="text-[11px] text-zinc-600 font-mono">{k.key_prefix}…</p>
                </div>
                <div className="hidden sm:block text-right text-[11px] text-zinc-600">
                  <p>Created {formatKeyDate(k.created_at)}</p>
                  <p>Last used {formatKeyDate(k.last_used_at)}</p>
                </div>
                <button
                  onClick={() => setRevokeTarget(k)}
                  aria-label={'Revoke ' + (k.name || 'key')}
                  className="p-2 text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke API key?"
        description={revokeTarget ? '"' + (revokeTarget.name || revokeTarget.key_prefix) + '" will stop working immediately. Applications using it will fail to authenticate.' : undefined}
        confirmLabel="Revoke"
        variant="danger"
        loading={revokeMutation.isPending}
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
        onClose={() => !revokeMutation.isPending && setRevokeTarget(null)}
      />

      <div className="pt-6 border-t border-white/[0.06]">
        <h4 className="text-sm font-medium text-white mb-3">API Documentation</h4>
        <p className="text-sm text-zinc-500 mb-4">
          Use the API to integrate Synthos with your workflows and applications.
        </p>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          View API Documentation
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/**
 * Two-factor authentication card. Hidden entirely until the backend exposes
 * /auth/2fa/* endpoints.
 */
function TwoFactorSettings() {
  const queryClient = useQueryClient();
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: platformApi.get2faStatus,
    retry: false,
    staleTime: 60_000,
  });

  const enrollMutation = useMutation({
    mutationFn: platformApi.enroll2fa,
    onSuccess: (data) => setEnrollment(data),
    onError: (err: Error) => toast.error('Could not start 2FA setup', err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (otp: string) => platformApi.activate2fa(otp),
    onSuccess: (data) => {
      setEnrollment(null);
      setCode('');
      setRecoveryCodes(data.recovery_codes ?? null);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success('Two-factor authentication enabled');
    },
    onError: (err: Error) => toast.error('Invalid code', err.message),
  });

  const disableMutation = useMutation({
    mutationFn: (otp: string) => platformApi.disable2fa(otp),
    onSuccess: () => {
      setDisabling(false);
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success('Two-factor authentication disabled');
    },
    onError: (err: Error) => toast.error('Invalid code', err.message),
  });

  // Backend hasn't shipped 2FA yet — render nothing.
  if (!status) return null;

  return (
    <div className="pt-8 mt-8 border-t border-white/[0.06] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Two-factor authentication
          </h3>
          <p className="text-sm text-zinc-500">
            Require a one-time code from an authenticator app when signing in.
          </p>
        </div>
        {status.enabled ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/20">Enabled</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-400 bg-white/[0.04] ring-1 ring-white/[0.08]">Off</span>
        )}
      </div>

      {recoveryCodes && (
        <div className="panel p-4">
          <p className="text-sm font-medium text-zinc-200 mb-2">Recovery codes — store these safely</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[13px] text-zinc-300">
            {recoveryCodes.map((rc) => <span key={rc}>{rc}</span>)}
          </div>
          <button onClick={() => setRecoveryCodes(null)} className="text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors">
            I&apos;ve stored them — dismiss
          </button>
        </div>
      )}

      {!status.enabled && !enrollment && (
        <button
          onClick={() => enrollMutation.mutate()}
          disabled={enrollMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {enrollMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Enable 2FA
        </button>
      )}

      {enrollment && (
        <div className="panel p-4 space-y-3 max-w-lg">
          <p className="text-sm text-zinc-300">
            Add this secret to your authenticator app (or open the setup link), then enter the 6-digit code:
          </p>
          <code className="block px-3 py-2 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08] font-mono text-[13px] text-zinc-200 break-all">
            {enrollment.secret}
          </code>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              aria-label="Authenticator code"
              className="w-32 px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-violet-500/50 font-mono tracking-widest text-center"
            />
            <button
              onClick={() => activateMutation.mutate(code)}
              disabled={code.length !== 6 || activateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {activateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Verify &amp; enable
            </button>
            <button onClick={() => { setEnrollment(null); setCode(''); }} className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {status.enabled && !disabling && (
        <button onClick={() => setDisabling(true)} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">
          Disable 2FA…
        </button>
      )}

      {disabling && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            aria-label="Authenticator code to disable"
            className="w-32 px-3 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-rose-500/50 font-mono tracking-widest text-center"
          />
          <button
            onClick={() => disableMutation.mutate(code)}
            disabled={code.length !== 6 || disableMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors"
          >
            {disableMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm disable
          </button>
          <button onClick={() => { setDisabling(false); setCode(''); }} className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const WEBHOOK_EVENTS = [
  { value: 'validation.completed', label: 'Validation Completed' },
  { value: 'validation.failed', label: 'Validation Failed' },
  { value: 'warranty.status_changed', label: 'Warranty Status Changed' },
  { value: 'credits.low', label: 'Credits Low' },
  { value: 'credits.purchased', label: 'Credits Purchased' },
];

function WebhookSettings() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [urlError, setUrlError] = useState('');
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);

  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: webhooksApi.list,
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['webhook-deliveries', expandedId],
    queryFn: () => (expandedId ? webhooksApi.getDeliveries(expandedId) : Promise.resolve({ deliveries: [] })),
    enabled: !!expandedId,
  });

  const createMutation = useMutation({
    mutationFn: () => webhooksApi.create(newUrl, selectedEvents),
    onSuccess: () => {
      setSuccessMessage('Webhook created successfully');
      setShowCreate(false);
      setNewUrl('');
      setSelectedEvents([]);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      webhooksApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: webhooksApi.delete,
    onSuccess: () => {
      setDeleteWebhookId(null);
      toast.success('Webhook deleted');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: () => {
      setDeleteWebhookId(null);
      toast.error('Failed to delete webhook', 'Please try again.');
    },
  });

  const handleCreate = () => {
    setUrlError('');
    if (!newUrl.startsWith('https://')) {
      setUrlError('URL must start with https://');
      return;
    }
    if (selectedEvents.length === 0) {
      setUrlError('Select at least one event');
      return;
    }
    createMutation.mutate();
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Webhooks</h3>
          <p className="text-sm text-zinc-500">Receive real-time notifications when events happen in your account.</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Webhook
          </button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {createMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">An error occurred. Please try again.</span>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">New Webhook</h4>
            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
            />
            {urlError && <p className="text-xs text-rose-400 mt-1">{urlError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Events</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((evt) => (
                <label
                  key={evt.value}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedEvents.includes(evt.value)
                      ? 'bg-violet-600/10 border-violet-500/30 text-white'
                      : 'bg-zinc-900/30 border-zinc-800/40 text-zinc-400 hover:border-zinc-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(evt.value)}
                    onChange={() => toggleEvent(evt.value)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 text-violet-500 focus:ring-violet-500/40 bg-zinc-800"
                  />
                  <span className="text-sm">{evt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Webhook'
            )}
          </button>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooksData?.webhooks?.length === 0 && !showCreate && (
          <div className="text-center py-10 text-zinc-500">
            <Globe className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No webhooks configured yet.</p>
          </div>
        )}

        {webhooksData?.webhooks?.map((webhook) => (
          <div key={webhook.id} className="rounded-xl bg-zinc-900/40 border border-white/[0.06] overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-sm font-mono text-white truncate">{webhook.url}</p>
                    {webhook.failure_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20 flex-shrink-0">
                        {webhook.failure_count} failures
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  {webhook.last_triggered_at && (
                    <p className="text-xs text-zinc-600 mt-1.5">
                      Last triggered {timeAgo(webhook.last_triggered_at)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  {/* Active/Inactive Toggle */}
                  <Switch
                    checked={webhook.is_active}
                    onChange={(is_active) => toggleMutation.mutate({ id: webhook.id, is_active })}
                    disabled={toggleMutation.isPending}
                    label={webhook.is_active ? 'Disable webhook' : 'Enable webhook'}
                    size="sm"
                  />

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedId(expandedId === webhook.id ? null : webhook.id)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {expandedId === webhook.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteWebhookId(webhook.id)}
                    disabled={deleteMutation.isPending}
                    aria-label="Delete webhook"
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Deliveries */}
            {expandedId === webhook.id && (
              <div className="border-t border-white/[0.06] bg-zinc-950/30">
                <div className="p-4">
                  <p className="text-xs font-medium text-zinc-400 mb-3">Recent Deliveries</p>
                  {!deliveriesData?.deliveries?.length ? (
                    <p className="text-xs text-zinc-600">No deliveries yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {deliveriesData.deliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                delivery.success ? 'bg-emerald-500' : 'bg-rose-500'
                              )}
                            />
                            <span className="text-xs text-zinc-300">{delivery.event_type}</span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-mono',
                                delivery.success
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              )}
                            >
                              {delivery.response_status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-600">{delivery.duration_ms}ms</span>
                            <span className="text-[10px] text-zinc-600">{timeAgo(delivery.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Webhook Confirmation */}
      <ConfirmDialog
        open={!!deleteWebhookId}
        title="Delete this webhook?"
        description="The endpoint will stop receiving event deliveries immediately. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteWebhookId && deleteMutation.mutate(deleteWebhookId)}
        onClose={() => !deleteMutation.isPending && setDeleteWebhookId(null)}
      />
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(() => resolveTab(tabParam) ?? 'profile');

  // Keep the active tab in sync when navigating to e.g. ?tab=notifications
  // while the page is already mounted.
  useEffect(() => {
    const resolved = resolveTab(tabParam);
    if (resolved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(resolved);
    }
  }, [tabParam]);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'api' as const, label: 'API', icon: Key },
    { id: 'webhooks' as const, label: 'Webhooks', icon: Globe },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs and Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-zinc-900/60 text-white'
                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/40'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="p-6 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <><SecuritySettings /><TwoFactorSettings /></>}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'api' && <ApiSettings />}
            {activeTab === 'webhooks' && <WebhookSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  // useSearchParams requires a Suspense boundary in prerendered pages.
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
