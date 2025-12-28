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
        {/* Main Background with subtle gradient */}
        <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0f1629] to-[#141c33]">
          <div className="flex">
            <DashboardSidebar />
            <main className="flex-1 min-h-screen lg:ml-0">
              {/* Mobile spacer */}
              <div className="h-14 lg:hidden" />
              <div className="p-4 lg:p-6">
                <DashboardTopbar />
                {children}
              </div>
            </main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
