'use client';

import { AuthProvider } from '@/providers/auth-provider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative z-10 w-full max-w-md px-4">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
