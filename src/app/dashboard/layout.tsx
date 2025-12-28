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
        <div className="min-h-screen bg-black">
          {/* Subtle grid background */}
          <div 
            className="fixed inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
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
