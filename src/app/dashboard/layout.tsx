'use client';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { DashboardSidebar, DashboardTopbar } from '@/components/dashboard/sidebar';
import { Loader2 } from 'lucide-react';

function DashboardGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
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
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryProvider>
        <DashboardGate>{children}</DashboardGate>
      </QueryProvider>
    </AuthProvider>
  );
}
