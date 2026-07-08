'use client';

import { LayoutDashboard, Ticket } from 'lucide-react';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SectionShell } from '@/components/app-shell/section-shell';
import { SectionGate } from '@/components/ui/section-gate';

const nav = [
  { name: 'Overview', href: '/support', icon: LayoutDashboard },
  { name: 'Tickets', href: '/support/tickets', icon: Ticket },
];

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <SectionGate role="support">
          <SectionShell accent="amber" badge="Support" homeHref="/support" nav={nav}>
            {children}
          </SectionShell>
        </SectionGate>
      </QueryProvider>
    </AuthProvider>
  );
}
