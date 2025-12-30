'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Building, 
  Key, 
  Bell, 
  Shield,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'api';

function ProfileSettings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" defaultValue={user?.name} placeholder="Mike Alts />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" defaultValue={user?.email} disabled />
          <p className="text-xs text-muted-foreground">
            Contact support to change your email
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" defaultValue={user?.company} placeholder="Acme Inc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" placeholder="ML Engineer" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={16} className="mr-2" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}

function SecuritySettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleChangePassword} className="space-y-6">
        <h3 className="text-lg font-medium">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <Input id="current" type="password" />
          </div>
          <div />
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input id="new" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <Input id="confirm" type="password" />
          </div>
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <Button variant="outline">Enable 2FA</Button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [validationComplete, setValidationComplete] = useState(true);
  const [warrantyExpiring, setWarrantyExpiring] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div>
          <p className="font-medium">Email Notifications</p>
          <p className="text-sm text-muted-foreground">
            Receive email notifications about your account
          </p>
        </div>
        <button
          onClick={() => setEmailNotifications(!emailNotifications)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            emailNotifications ? "bg-primary" : "bg-muted"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full bg-white transition-transform",
            emailNotifications ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </div>

      <div className="flex items-center justify-between py-4 border-b border-border">
        <div>
          <p className="font-medium">Validation Complete</p>
          <p className="text-sm text-muted-foreground">
            Get notified when a validation job completes
          </p>
        </div>
        <button
          onClick={() => setValidationComplete(!validationComplete)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            validationComplete ? "bg-primary" : "bg-muted"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full bg-white transition-transform",
            validationComplete ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </div>

      <div className="flex items-center justify-between py-4 border-b border-border">
        <div>
          <p className="font-medium">Warranty Expiring</p>
          <p className="text-sm text-muted-foreground">
            Reminder before a warranty expires
          </p>
        </div>
        <button
          onClick={() => setWarrantyExpiring(!warrantyExpiring)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            warrantyExpiring ? "bg-primary" : "bg-muted"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full bg-white transition-transform",
            warrantyExpiring ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </div>

      <div className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium">Weekly Digest</p>
          <p className="text-sm text-muted-foreground">
            Weekly summary of your validation activity
          </p>
        </div>
        <button
          onClick={() => setWeeklyDigest(!weeklyDigest)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            weeklyDigest ? "bg-primary" : "bg-muted"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full bg-white transition-transform",
            weeklyDigest ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </div>
    </div>
  );
}

function ApiSettings() {
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // API key should be fetched from backend, never hardcoded
  const fetchApiKey = async () => {
    setIsLoading(true);
    try {
      // This would call your backend to get the user's API key
      // const response = await apiClient.get('/auth/api-key');
      // setApiKey(response.data.api_key);
      setApiKey('••••••••••••••••••••••••••••••'); // Placeholder until backend implements
    } catch (error) {
      console.error('Failed to fetch API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!apiKey || apiKey.includes('•')) {
      // Fetch real key first if not loaded
      await fetchApiKey();
    }
    if (apiKey && !apiKey.includes('•')) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">API Key</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use this key to authenticate API requests. Keep it secret!
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-md px-4 py-2 font-mono text-sm">
            {isLoading ? 'Loading...' : (showKey && apiKey ? apiKey : '••••••••••••••••••••••••••••••')}
          </div>
          <Button variant="outline" onClick={() => { if (!showKey) fetchApiKey(); setShowKey(!showKey); }} disabled={isLoading}>
            {showKey ? 'Hide' : 'Show'}
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={isLoading}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-medium mb-4">Regenerate Key</h3>
        <p className="text-sm text-muted-foreground mb-4">
          If you believe your API key has been compromised, you can generate a new one.
          This will invalidate the current key.
        </p>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10">
          Regenerate API Key
        </Button>
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-medium mb-4">Webhooks</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure webhook endpoints to receive real-time events.
        </p>
        <Button variant="outline">Configure Webhooks</Button>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'api' as const, label: 'API', icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-48 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'api' && <ApiSettings />}
        </div>
      </div>
    </div>
  );
}
