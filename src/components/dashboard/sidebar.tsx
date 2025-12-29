'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronRight,
  X,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SynthosLogo } from '@/components/ui/synthos-logo';
import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Validations', href: '/dashboard/validations', icon: CheckCircle },
  { name: 'Warranties', href: '/dashboard/warranties', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// Light theme Nav Item with glassmorphic style
function NavItem({ 
  item, 
  isActive, 
  collapsed,
  onClick 
}: { 
  item: typeof navigation[0]; 
  isActive: boolean; 
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
        isActive 
          ? "text-violet-700 bg-white/80 shadow-[0_4px_20px_rgba(108,92,231,0.15)]" 
          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-violet-500"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      
      <Icon size={20} className={cn(
        "relative z-10 transition-colors shrink-0",
        isActive ? "text-violet-600" : "group-hover:text-slate-700"
      )} />
      
      {!collapsed && (
        <span className={cn(
          "relative z-10 text-sm font-medium truncate",
          isActive ? "text-slate-800" : ""
        )}>
          {item.name}
        </span>
      )}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <SynthosLogo size={28} />
          <span className="font-semibold text-slate-800">Synthos</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "bg-gradient-to-b from-slate-50/95 to-white/90 backdrop-blur-xl border-r border-slate-200/50",
          "shadow-[4px_0_24px_rgba(0,0,0,0.04)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[72px]" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <SynthosLogo size={32} />
            {!collapsed && (
              <span className="font-semibold text-lg text-slate-800">Synthos</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft
              size={16}
              className={cn("transition-transform duration-300", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={isActive} 
                collapsed={collapsed}
                onClick={() => setMobileOpen(false)}
              />
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-200/50">
          {user && (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-white/60",
              collapsed ? "justify-center" : ""
            )}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium shrink-0 shadow-md">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-2 mt-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// Topbar Component - Light theme
export function DashboardTopbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1);
      return { href, label };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="mb-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
            <Link 
              href={crumb.href}
              className={cn(
                "transition-colors",
                index === breadcrumbs.length - 1 
                  ? "text-slate-700 font-medium" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur border border-slate-200/50 shadow-sm focus-within:border-violet-300 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search here"
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-48"
          />
        </div>

        {/* Help */}
        <button className="p-2.5 rounded-xl bg-white/80 backdrop-blur border border-slate-200/50 shadow-sm hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 transition-all">
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur border border-slate-200/50 shadow-sm hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 transition-all">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium shadow-md ring-2 ring-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
