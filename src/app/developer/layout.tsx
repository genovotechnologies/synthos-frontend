'use client';

import { LayoutDashboard, Server, BookOpen, Terminal, ScrollText, BarChart3 } from 'lucide-react';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SectionShell } from '@/components/app-shell/section-shell';
import { SectionGate } from '@/components/ui/section-gate';

const nav = [
  { name: 'Overview', href: '/developer', icon: LayoutDashboard },
  { name: 'Services', href: '/developer/services', icon: Server },
  { name: 'API Docs', href: '/developer/api-docs', icon: BookOpen },
  { name: 'Playground', href: '/developer/playground', icon: Terminal },
  { name: 'Logs', href: '/developer/logs', icon: ScrollText },
  { name: 'Metrics', href: '/developer/metrics', icon: BarChart3 },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <SectionGate role="developer">
          <SectionShell accent="blue" badge="Developer" homeHref="/developer" nav={nav}>
            {children}
          </SectionShell>
        </SectionGate>
      </QueryProvider>
    </AuthProvider>
  );
}
