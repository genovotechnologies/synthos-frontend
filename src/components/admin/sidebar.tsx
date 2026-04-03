'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Tag, Mail, CheckCircle, Database, Settings, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
  { name: 'Invites', href: '/admin/invites', icon: Mail },
  { name: 'Validations', href: '/admin/validations', icon: CheckCircle },
  { name: 'Datasets', href: '/admin/datasets', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0b] border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <SynthosLogo size={24} />
          <span className="font-medium text-zinc-100 text-sm">Synthos</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">Admin</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-56 flex flex-col bg-[#0a0a0b] border-r border-zinc-900/80 transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-zinc-900/80">
          <Link href="/admin" className="flex items-center gap-2.5">
            <SynthosLogo size={24} />
            <span className="font-medium text-zinc-100 text-sm tracking-tight">Synthos</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive ? "text-zinc-100 bg-zinc-900/60" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-rose-400" : ""} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-900/80">
          {user && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{user.name}</p>
                <p className="text-xs text-zinc-600 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
