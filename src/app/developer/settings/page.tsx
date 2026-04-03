'use client';

import { Settings } from 'lucide-react';

export default function DeveloperSettings() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">Developer Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Development environment preferences</p>
      </header>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <Settings className="w-7 h-7 text-zinc-600" />
        </div>
        <h3 className="text-lg font-medium text-zinc-200 mb-1">Coming Soon</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Developer preferences including API rate limits, webhook configuration, and monitoring settings.
        </p>
      </div>
    </div>
  );
}
