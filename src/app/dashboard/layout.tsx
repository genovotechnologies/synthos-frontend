'use client';

import { LayoutDashboard, Database, CheckCircle, Shield, Settings, CreditCard, HelpCircle } from 'lucide-react';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SectionShell } from '@/components/app-shell/section-shell';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { SectionGate } from '@/components/ui/section-gate';

const nav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Validations', href: '/dashboard/validations', icon: CheckCircle },
  { name: 'Warranties', href: '/dashboard/warranties', icon: Shield },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryProvider>
        <SectionGate>
          <SectionShell accent="violet" homeHref="/dashboard" nav={nav} topbar={<DashboardTopbar />}>
            {children}
          </SectionShell>
          <CommandPalette />
        </SectionGate>
      </QueryProvider>
    </AuthProvider>
  );
}
