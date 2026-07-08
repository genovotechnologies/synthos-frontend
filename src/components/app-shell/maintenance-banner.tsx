'use client';

import * as React from 'react';
import { Wrench } from 'lucide-react';

/**
 * Renders a site-wide notice while the platform is in maintenance mode
 * (admin setting). Reads the same-origin /api/status route, which mirrors the
 * backend health payload; renders nothing when the flag is absent or false.
 */
export function MaintenanceBanner() {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setActive(data.maintenance === true);
      } catch {
        // Status endpoint unreachable — keep the banner hidden.
      }
    };

    check();
    const interval = setInterval(check, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="relative z-40 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/15 backdrop-blur-sm text-amber-300 text-[13px] font-medium">
      <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
      Synthos is undergoing scheduled maintenance — validations may be delayed. Data is safe.
    </div>
  );
}
