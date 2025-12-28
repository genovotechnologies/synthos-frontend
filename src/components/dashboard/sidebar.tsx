'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  CheckCircle, 
  Shield, 
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { useAuth } from '@/providers/auth-provider';
import { useState } from 'react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Validations', href: '/dashboard/validations', icon: CheckCircle },
  { name: 'Warranties', href: '/dashboard/warranties', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header - Glassmorphic */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-dark px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <SynthosLogo size={28} />
          <span className="font-semibold text-white">Synthos</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
        >
          <Menu size={20} className="text-white" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphic Design */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "glass-dark rounded-none lg:rounded-r-3xl lg:m-4 lg:my-4 lg:ml-0 lg:h-[calc(100vh-2rem)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20" : "w-72"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-violet/30 blur-xl rounded-full" />
              <SynthosLogo size={36} className="relative" />
            </div>
            {!collapsed && (
              <span className="font-bold text-xl text-white tracking-tight">Synthos</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft
              size={18}
              className={cn("transition-transform duration-300", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet/20 text-white shadow-lg shadow-violet/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center",
                  isActive && "text-violet"
                )}>
                  {isActive && (
                    <div className="absolute inset-0 bg-violet/40 blur-lg rounded-full" />
                  )}
                  <Icon size={20} className="relative" />
                </div>
                {!collapsed && <span>{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet glow-violet" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          {user && !collapsed && (
            <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-mint flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
            </div>
          )}
          {collapsed && user && (
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-mint flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium",
              "text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// Topbar Component for Dashboard
export function DashboardTopbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 glass-dark rounded-2xl mb-6 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search here"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet/50 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <HelpCircle size={20} />
        </button>
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mint rounded-full glow-mint" />
        </button>
        
        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet to-mint flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-violet/20">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
