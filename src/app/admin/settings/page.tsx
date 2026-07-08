'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle, AlertTriangle } from 'lucide-react';

// Numeric fields are kept as strings in form state so clearing an input never
// produces NaN; they are validated and converted on save.
interface SettingsFormState {
  registration_enabled: boolean;
  maintenance_mode: boolean;
  max_upload_size_gb: string;
  default_signup_credits: string;
  allowed_email_domains: string;
}

const defaultSettings: SettingsFormState = {
  registration_enabled: true,
  maintenance_mode: false,
  max_upload_size_gb: '10',
  default_signup_credits: '100',
  allowed_email_domains: '',
};

// Loose hostname check: labels of letters/digits/hyphens plus at least one dot.
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsFormState>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsFormState>(defaultSettings);
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SettingsFormState, string>>>({});
  const [syncedData, setSyncedData] = useState<unknown>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    retry: 1,
  });

  // Sync fetched settings into form state when the server data changes
  // (render-time state adjustment; avoids an extra effect pass).
  if (data && data !== syncedData) {
    setSyncedData(data);
    const loaded: SettingsFormState = {
      registration_enabled: data.registration_enabled ?? defaultSettings.registration_enabled,
      maintenance_mode: data.maintenance_mode ?? defaultSettings.maintenance_mode,
      max_upload_size_gb: String(data.max_upload_size_gb ?? defaultSettings.max_upload_size_gb),
      default_signup_credits: String(data.default_signup_credits ?? defaultSettings.default_signup_credits),
      allowed_email_domains: data.allowed_email_domains ?? defaultSettings.allowed_email_domains,
    };
    setSettings(loaded);
    setOriginalSettings(loaded);
  }

  const saveMutation = useMutation({
    mutationFn: ({ changed }: { changed: Record<string, unknown>; normalized: SettingsFormState }) =>
      adminApi.updateSettings(changed),
    onSuccess: (_data, variables) => {
      setSuccessMessage('Settings saved successfully');
      setSettings(variables.normalized);
      setOriginalSettings(variables.normalized);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const setField = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSave = () => {
    const errors: Partial<Record<keyof SettingsFormState, string>> = {};

    const uploadSize = Number(settings.max_upload_size_gb);
    if (settings.max_upload_size_gb.trim() === '' || !Number.isFinite(uploadSize) || uploadSize <= 0) {
      errors.max_upload_size_gb = 'Enter a positive number.';
    }

    const signupCredits = Number(settings.default_signup_credits);
    if (settings.default_signup_credits.trim() === '' || !Number.isInteger(signupCredits) || signupCredits < 0) {
      errors.default_signup_credits = 'Enter a whole number of 0 or more.';
    }

    // Normalize the comma-separated domain list: split, trim, drop empties, re-join.
    const domains = settings.allowed_email_domains.split(',').map((d) => d.trim()).filter(Boolean);
    const badDomains = domains.filter((d) => !DOMAIN_RE.test(d));
    if (badDomains.length > 0) {
      errors.allowed_email_domains = `Invalid domain${badDomains.length > 1 ? 's' : ''}: ${badDomains.join(', ')}`;
    }

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const normalizedDomains = domains.join(', ');
    const normalized: SettingsFormState = { ...settings, allowed_email_domains: normalizedDomains };

    const changed: Record<string, unknown> = {};
    if (normalized.registration_enabled !== originalSettings.registration_enabled) {
      changed.registration_enabled = normalized.registration_enabled;
    }
    if (normalized.maintenance_mode !== originalSettings.maintenance_mode) {
      changed.maintenance_mode = normalized.maintenance_mode;
    }
    if (uploadSize !== Number(originalSettings.max_upload_size_gb)) {
      changed.max_upload_size_gb = uploadSize;
    }
    if (signupCredits !== Number(originalSettings.default_signup_credits)) {
      changed.default_signup_credits = signupCredits;
    }
    if (normalizedDomains !== originalSettings.allowed_email_domains) {
      // Backend shape unknown; keep sending the (normalized) string.
      changed.allowed_email_domains = normalizedDomains;
    }

    if (Object.keys(changed).length === 0) return;
    saveMutation.mutate({ changed, normalized });
  };

  const hasChanges = (Object.keys(settings) as (keyof SettingsFormState)[]).some(
    (key) => settings[key] !== originalSettings[key]
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Admin Settings</h1>
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
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Admin Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform configuration and preferences</p>
      </header>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {saveMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to save settings. Please try again.</span>
        </div>
      )}

      <div className="space-y-6 max-w-lg">
        {/* Registration Enabled */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-zinc-200">Registration Enabled</p>
            <p className="text-xs text-zinc-500 mt-0.5">Allow new users to register on the platform</p>
          </div>
          <Switch
            checked={settings.registration_enabled}
            onChange={(checked) => setField('registration_enabled', checked)}
            activeClass="bg-emerald-600"
            label="Registration enabled"
          />
        </div>

        {/* Maintenance Mode */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-xl border',
          settings.maintenance_mode
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-zinc-900/30 border-white/[0.06]'
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
          <Switch
            checked={settings.maintenance_mode}
            onChange={(checked) => setField('maintenance_mode', checked)}
            activeClass="bg-emerald-600"
            label="Maintenance mode"
            className="shrink-0"
          />
        </div>

        {/* Max Upload Size */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Max Upload Size (GB)</label>
          <p className="text-xs text-zinc-500 mb-3">Maximum file size users can upload</p>
          <input
            type="number"
            min={1}
            max={500}
            value={settings.max_upload_size_gb}
            onChange={(e) => setField('max_upload_size_gb', e.target.value)}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800/50 border rounded-lg text-sm text-zinc-300 focus:outline-none',
              fieldErrors.max_upload_size_gb ? 'border-rose-500/50' : 'border-zinc-700 focus:border-rose-500/50'
            )}
          />
          {fieldErrors.max_upload_size_gb && (
            <p className="text-xs text-rose-400 mt-2">{fieldErrors.max_upload_size_gb}</p>
          )}
        </div>

        {/* Default Signup Credits */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Default Signup Credits</label>
          <p className="text-xs text-zinc-500 mb-3">Credits given to new users upon registration</p>
          <input
            type="number"
            min={0}
            value={settings.default_signup_credits}
            onChange={(e) => setField('default_signup_credits', e.target.value)}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800/50 border rounded-lg text-sm text-zinc-300 focus:outline-none',
              fieldErrors.default_signup_credits ? 'border-rose-500/50' : 'border-zinc-700 focus:border-rose-500/50'
            )}
          />
          {fieldErrors.default_signup_credits && (
            <p className="text-xs text-rose-400 mt-2">{fieldErrors.default_signup_credits}</p>
          )}
        </div>

        {/* Allowed Email Domains */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
          <label className="block text-sm font-medium text-zinc-200 mb-1">Allowed Email Domains</label>
          <p className="text-xs text-zinc-500 mb-3">Comma-separated domains. Leave empty to allow all.</p>
          <input
            type="text"
            value={settings.allowed_email_domains}
            onChange={(e) => setField('allowed_email_domains', e.target.value)}
            placeholder="example.com, company.org"
            className={cn(
              'w-full px-3 py-2 bg-zinc-800/50 border rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none',
              fieldErrors.allowed_email_domains ? 'border-rose-500/50' : 'border-zinc-700 focus:border-rose-500/50'
            )}
          />
          {fieldErrors.allowed_email_domains && (
            <p className="text-xs text-rose-400 mt-2">{fieldErrors.allowed_email_domains}</p>
          )}
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
