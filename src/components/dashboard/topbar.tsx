'use client';

import { Search } from 'lucide-react';
import NotificationsDropdown from './notifications-dropdown';
import { openCommandPalette } from './command-palette';

export function DashboardTopbar() {
  return (
    <header className="flex items-center justify-end">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.03] ring-1 ring-white/[0.07] hover:ring-white/[0.14] hover:bg-white/[0.05] transition-all"
        >
          <Search size={13} className="text-zinc-600" />
          <span className="w-36 text-left text-[13px] text-zinc-600">Search…</span>
          <kbd className="text-[10px] text-zinc-600 bg-white/[0.05] ring-1 ring-white/[0.06] px-1.5 py-0.5 rounded-md">⌘K</kbd>
        </button>

        <NotificationsDropdown />
      </div>
    </header>
  );
}
