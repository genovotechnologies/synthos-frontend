"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface SectionGateProps {
  children: React.ReactNode;
  /**
   * Minimum role required for this section. Uses the same hierarchy as the
   * middleware (admin > developer > support > user). Omit for auth-only gating.
   */
  role?: "admin" | "developer" | "support";
}

/**
 * Client-side guard for authenticated sections. Redirects unauthenticated
 * visitors to /login (preserving the intended destination) and users without
 * the required role to their own dashboard.
 */
export function SectionGate({ children, role }: SectionGateProps) {
  const { isLoading, isAuthenticated, hasRole, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // When /auth/me is unavailable the provider falls back to a placeholder user
  // with no role; in that case defer role enforcement to the middleware/backend
  // instead of booting legitimate staff out of their section.
  const roleKnown = user?.id !== "temp";
  const roleDenied = Boolean(role && roleKnown && !hasRole(role));

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (roleDenied) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, roleDenied, router, pathname]);

  if (isLoading || !isAuthenticated || roleDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return <>{children}</>;
}
