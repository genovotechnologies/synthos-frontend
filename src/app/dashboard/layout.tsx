'use client';

import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryProvider>
        <div className="min-h-screen bg-background">
          <div className="flex">
            <DashboardSidebar />
            <main className="flex-1 min-h-screen lg:ml-0">
              {/* Mobile spacer */}
              <div className="h-14 lg:hidden" />
              <div className="p-4 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
