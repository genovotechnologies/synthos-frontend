'use client';

import * as React from 'react';
import { Eye, LogOut } from 'lucide-react';
import { getImpersonation, endImpersonation, type ImpersonationState } from '@/lib/impersonation';

/**
 * Persistent, unmissable banner shown for the entire "view as user" session.
 * Not dismissible — the only way out is the Exit button, which restores the
 * admin's own session.
 */
export function ImpersonationBanner() {
  const [state, setState] = React.useState<ImpersonationState | null>(null);

  React.useEffect(() => {
    setState(getImpersonation());
    // Re-check periodically so token expiry restores the admin session promptly.
    const interval = setInterval(() => setState(getImpersonation()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return null;

  const exit = () => {
    endImpersonation();
    window.location.href = '/admin/users';
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 bg-gradient-to-r from-rose-600/90 via-rose-500/90 to-rose-600/90 text-white text-[13px] font-medium shadow-[0_4px_24px_-8px_rgba(244,63,94,0.6)]"
    >
      <span className="flex items-center gap-2">
        <Eye className="w-4 h-4 flex-shrink-0" />
        Viewing as <strong className="font-semibold">{state.user_label}</strong>
        <span className="hidden sm:inline text-white/70">
          — billing and destructive actions are disabled
        </span>
      </span>
      <button
        onClick={exit}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 ring-1 ring-white/30 font-semibold transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Exit
      </button>
    </div>
  );
}
