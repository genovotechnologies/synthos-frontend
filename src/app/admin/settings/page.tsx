'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle, AlertTriangle } from 'lucide-react';

interface PlatformSettings {
  registration_enabled: boolean;
  maintenance_mode: boolean;
  max_upload_size_gb: number;
  default_signup_credits: number;
  allowed_email_domains: string;
}

const defaultSettings: PlatformSettings = {
  registration_enabled: true,
  maintenance_mode: false,
  max_upload_size_gb: 10,
  default_signup_credits: 100,
  allowed_email_domains: '',
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(defaultSettings);
  const [successMessage, setSuccessMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      const loaded: PlatformSettings = {
        registration_enabled: data.registration_enabled ?? defaultSettings.registration_enabled,
        maintenance_mode: data.maintenance_mode ?? defaultSettings.maintenance_mode,
        max_upload_size_gb: data.max_upload_size_gb ?? defaultSettings.max_upload_size_gb,
        default_signup_credits: data.default_signup_credits ?? defaultSettings.default_signup_credits,
        allowed_email_domains: data.allowed_email_domains ?? defaultSettings.allowed_email_domains,
      };
      setSettings(loaded);
      setOriginalSettings(loaded);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (changed: Record<string, any>) => adminApi.updateSettings(changed),
    onSuccess: () => {
      setSuccessMessage('Settings saved successfully');
      setOriginalSettings({ ...settings });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSave = () => {
    const changed: Record<string, any> = {};
    for (const key of Object.keys(settings) as (keyof PlatformSettings)[]) {
      if (settings[key] !== originalSettings[key]) {
        changed[key] = settings[key];
      }
    }
    if (Object.keys(changed).length === 0) return;
    saveMutation.mutate(changed);
  };

  const hasChanges = Object.keys(settings).some(
    (key) => settings[key as keyof PlatformSettings] !== originalSettings[key as keyof PlatformSettings]
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Admin Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Platform configuration and preferences</p>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Admin Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform configuration and preferences</p>
      </header>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {saveMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to save settings. Please try again.</span>
        </div>
      )}

      <div className="space-y-6 max-w-lg">
        {/* Registration Enabled */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <div>
            <p className="text-sm font-medium text-zinc-200">Registration Enabled</p>
            <p className="text-xs text-zinc-500 mt-0.5">Allow new users to register on the platform</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, registration_enabled: !settings.registration_enabled })}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              settings.registration_enabled ? 'bg-rose-600' : 'bg-zinc-700'
            )}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              settings.registration_enabled ? 'left-6' : 'left-1'
            )} />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-xl border',
          settings.maintenance_mode
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-zinc-900/30 border-zinc-800/50'
        )}>
          <div className="flex items-start gap-3">
            {settings.maintenance_mode && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
            <div>
              <p className="text-sm font-medium text-zinc-200">Maintenance Mode</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {settings.maintenance_mode
                  ? 'Platform is in maintenance mode. Users cannot access services.'
                  : 'Enable to temporarily disable platform access for users'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors shrink-0',
              settings.maintenance_mode ? 'bg-amber-600' : 'bg-zinc-700'
            )}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              settings.maintenance_mode ? 'left-6' : 'left-1'
            )} />
          </button>
        </div>

        {/* Max Upload Size */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Max Upload Size (GB)</label>
          <p className="text-xs text-zinc-500 mb-3">Maximum file size users can upload</p>
          <input
            type="number"
            min={1}
            max={500}
            value={settings.max_upload_size_gb}
            onChange={(e) => setSettings({ ...settings, max_upload_size_gb: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Default Signup Credits */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Default Signup Credits</label>
          <p className="text-xs text-zinc-500 mb-3">Credits given to new users upon registration</p>
          <input
            type="number"
            min={0}
            value={settings.default_signup_credits}
            onChange={(e) => setSettings({ ...settings, default_signup_credits: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Allowed Email Domains */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Allowed Email Domains</label>
          <p className="text-xs text-zinc-500 mb-3">Comma-separated domains. Leave empty to allow all.</p>
          <input
            type="text"
            value={settings.allowed_email_domains}
            onChange={(e) => setSettings({ ...settings, allowed_email_domains: e.target.value })}
            placeholder="example.com, company.org"
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/30 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {saveMutation.isPending ? (
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
