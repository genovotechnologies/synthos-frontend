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
  X
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

// Vertical Tubelight Nav Item
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
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
        isActive 
          ? "text-white" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      )}
    >
      {/* Tubelight glow effect on the left */}
      {isActive && (
        <>
          {/* Glow */}
          <motion.div
            layoutId="sidebar-glow"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-violet-500"
            style={{
              boxShadow: '0 0 20px 4px rgba(139, 92, 246, 0.5), 0 0 40px 8px rgba(139, 92, 246, 0.3)',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          {/* Background highlight */}
          <motion.div
            layoutId="sidebar-bg"
            className="absolute inset-0 bg-white/5 rounded-lg"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </>
      )}
      
      <Icon size={20} className={cn(
        "relative z-10 transition-colors shrink-0",
        isActive ? "text-violet-400" : "group-hover:text-white"
      )} />
      
      {!collapsed && (
        <span className="relative z-10 text-sm font-medium truncate">
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <SynthosLogo size={28} />
          <span className="font-semibold text-white">Synthos</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
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
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "bg-zinc-950 border-r border-white/10",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[72px]" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <SynthosLogo size={32} />
            {!collapsed && (
              <span className="font-semibold text-lg text-white">Synthos</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
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
        <div className="p-3 border-t border-white/10">
          {user && (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              collapsed ? "justify-center" : ""
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-2 mt-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors",
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

// Topbar Component
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
            {index > 0 && <ChevronRight size={14} className="text-zinc-600" />}
            <Link 
              href={crumb.href}
              className={cn(
                "transition-colors",
                index === breadcrumbs.length - 1 
                  ? "text-white font-medium" 
                  : "text-zinc-500 hover:text-zinc-300"
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
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
          <Search size={16} className="text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none w-48"
          />
          <kbd className="hidden lg:inline-flex text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
