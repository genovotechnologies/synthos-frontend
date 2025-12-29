'use client';

import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { DashboardSidebar, DashboardTopbar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-violet-50/30">
          {/* Soft glassmorphic background decorations */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Top-right decoration */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
            {/* Bottom-left decoration */}
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
            {/* Center decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
          </div>
          
          <div className="flex relative">
            <DashboardSidebar />
            <main className="flex-1 min-h-screen lg:ml-0">
              {/* Mobile spacer */}
              <div className="h-14 lg:hidden" />
              <div className="p-4 lg:p-6">
                <DashboardTopbar />
                <div className="relative">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
