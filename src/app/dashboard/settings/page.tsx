'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Settings, Shield, Key, Bell, Eye, EyeOff, Copy, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { authApi, type NotificationPreferences } from '@/lib/api';

type TabType = 'profile' | 'security' | 'notifications' | 'api';

function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
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
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2.5 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-zinc-500 cursor-not-allowed"
          />
          <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            placeholder="Your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            placeholder="Your role"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="w-fit px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
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
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
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
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
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
              className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
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
          className="w-fit px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
  });

  useEffect(() => {
    if (preferences) {
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to save preferences. Please try again.</span>
        </div>
      )}

      <div className="space-y-1">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-white">{option.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
            </div>
            <button
              onClick={() => handleToggle(option.key)}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings[option.key] ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings[option.key] ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSettings() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: apiKeyData, isLoading, refetch } = useQuery({
    queryKey: ['api-key'],
    queryFn: authApi.getApiKey,
  });

  const regenerateMutation = useMutation({
    mutationFn: authApi.regenerateApiKey,
    onSuccess: () => {
      setSuccessMessage('API key regenerated successfully');
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const apiKey = apiKeyData?.api_key || 'sk_live_••••••••••••••••••••••••••••••••';
  const displayKey = showKey ? apiKey : 'sk_live_••••••••••••••••••••••••••••••••';

  const handleCopy = () => {
    if (apiKey && !apiKey.includes('••••')) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the existing key.')) {
      regenerateMutation.mutate();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-white mb-1">API Access</h3>
        <p className="text-sm text-zinc-500">Manage your API key for programmatic access.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {regenerateMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to regenerate API key. Please try again.</span>
        </div>
      )}

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Your API Key</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              {isLoading ? (
                <div className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <input
                  type="text"
                  value={displayKey}
                  readOnly
                  className="w-full px-4 py-2.5 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white font-mono text-sm"
                />
              )}
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleCopy}
              disabled={!showKey || isLoading}
              className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-zinc-300 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Keep your API key secure. Do not share it publicly or commit it to version control.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 text-zinc-300 rounded-lg transition-colors"
        >
          {regenerateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate Key
        </button>
      </div>

      <div className="pt-6 border-t border-zinc-800/50">
        <h4 className="text-sm font-medium text-white mb-3">API Documentation</h4>
        <p className="text-sm text-zinc-500 mb-4">
          Use the API to integrate Synthos with your workflows and applications.
        </p>
        <a
          href="https://docs.synthos.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View API Documentation
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'api' as const, label: 'API', icon: Key },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your account settings and preferences</p>
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
                    ? 'bg-zinc-800/80 text-white'
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
          <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'api' && <ApiSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
