'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { MaintenanceBanner } from './maintenance-banner';
import { ImpersonationBanner } from './impersonation-banner';
import { useAuth } from '@/providers/auth-provider';

export interface SectionNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export type SectionAccent = 'violet' | 'rose' | 'blue' | 'amber';

interface AccentTheme {
  badge: string;
  icon: string;
  activeBg: string;
  dot: string;
  glowHex: string;
}

const ACCENTS: Record<SectionAccent, AccentTheme> = {
  violet: {
    badge: 'bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20',
    icon: 'text-violet-400',
    activeBg: 'bg-violet-500/[0.08]',
    dot: 'bg-violet-400',
    glowHex: '#8b5cf6',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20',
    icon: 'text-rose-400',
    activeBg: 'bg-rose-500/[0.08]',
    dot: 'bg-rose-400',
    glowHex: '#f43f5e',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20',
    icon: 'text-blue-400',
    activeBg: 'bg-blue-500/[0.08]',
    dot: 'bg-blue-400',
    glowHex: '#3b82f6',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20',
    icon: 'text-amber-400',
    activeBg: 'bg-amber-500/[0.08]',
    dot: 'bg-amber-400',
    glowHex: '#f59e0b',
  },
};

interface SectionShellProps {
  accent: SectionAccent;
  /** Small chip next to the logo, e.g. "Admin". Omit for the main dashboard. */
  badge?: string;
  homeHref: string;
  nav: SectionNavItem[];
  /** Right-aligned toolbar rendered above the page content (search, notifications…) */
  topbar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared application shell: ambient depth background, floating glass sidebar,
 * and the content column. One component drives dashboard/admin/developer/support
 * so the sections stay visually identical apart from accent + nav.
 */
export function SectionShell({ accent, badge, homeHref, nav, topbar, children }: SectionShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = ACCENTS[accent];

  const brand = (
    <Link href={homeHref} className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
      <SynthosLogo size={26} />
      <span className="font-semibold text-zinc-100 text-[15px] tracking-tight">Synthos</span>
      {badge && (
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', theme.badge)}>
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Ambient depth — soft accent glows instead of boxed surfaces */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-40 h-[38rem] w-[38rem] rounded-full blur-3xl opacity-[0.08]"
          style={{ background: `radial-gradient(circle, ${theme.glowHex}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-56 -right-48 h-[42rem] w-[42rem] rounded-full blur-3xl opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        {brand}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className="relative flex">
        {/* Floating sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-60 flex-shrink-0 transition-transform duration-200 lg:h-screen',
            'lg:py-4 lg:pl-4',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-full flex-col rounded-none lg:rounded-2xl bg-zinc-900/60 lg:bg-white/[0.03] backdrop-blur-2xl ring-1 ring-white/[0.06] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="px-5 pt-5 pb-4">{brand}</div>

            <nav className="flex-1 px-3 pt-2 overflow-y-auto">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== homeHref && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150',
                          isActive
                            ? cn('text-zinc-100', theme.activeBg)
                            : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0 h-4 w-0.5 rounded-full transition-opacity',
                            theme.dot,
                            isActive ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <Icon size={16} className={cn('transition-colors', isActive ? theme.icon : 'text-zinc-600 group-hover:text-zinc-400')} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-3 pb-4 pt-3">
              <div className="h-px bg-white/[0.06] mx-2 mb-3" />
              {user && (
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 ring-1 ring-white/[0.08] flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-200 truncate leading-tight">{user.name}</p>
                    <p className="text-[11px] text-zinc-600 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12.5px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content column */}
        <main className="relative flex-1 min-w-0 min-h-screen">
          <div className="h-14 lg:hidden" />
          <ImpersonationBanner />
          <MaintenanceBanner />
          <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-[1400px] mx-auto">
            {topbar}
            <div className={topbar ? 'mt-8' : 'mt-2'}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
