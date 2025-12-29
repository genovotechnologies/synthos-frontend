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
        <div className="min-h-screen bg-[#0a0a0b]">
          <div className="flex relative">
            <DashboardSidebar />
            <main className="flex-1 min-h-screen">
              <div className="h-14 lg:hidden" />
              <div className="px-6 lg:px-12 py-8 lg:py-10 max-w-[1400px]">
                <DashboardTopbar />
                <div className="mt-8">
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
