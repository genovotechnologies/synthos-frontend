'use client';

import { LayoutDashboard, Users, Tag, Mail, CheckCircle, Database, ScrollText, Settings, Shield, TrendingUp } from 'lucide-react';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SectionShell } from '@/components/app-shell/section-shell';
import { SectionGate } from '@/components/ui/section-gate';

const nav = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Growth', href: '/admin/growth', icon: TrendingUp },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
  { name: 'Invites', href: '/admin/invites', icon: Mail },
  { name: 'Validations', href: '/admin/validations', icon: CheckCircle },
  { name: 'Warranties', href: '/admin/warranties', icon: Shield },
  { name: 'Datasets', href: '/admin/datasets', icon: Database },
  { name: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <SectionGate role="admin">
          <SectionShell accent="rose" badge="Admin" homeHref="/admin" nav={nav}>
            {children}
          </SectionShell>
        </SectionGate>
      </QueryProvider>
    </AuthProvider>
  );
}
