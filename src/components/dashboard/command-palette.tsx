"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ShieldCheck,
  FileCheck,
  CreditCard,
  Settings,
  LifeBuoy,
  Search,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  label: string;
  href: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: PaletteItem[] = [
  { label: "Overview", href: "/dashboard", keywords: "home dashboard overview stats", icon: LayoutDashboard },
  { label: "Datasets", href: "/dashboard/datasets", keywords: "datasets upload files data", icon: Database },
  { label: "Validations", href: "/dashboard/validations", keywords: "validations runs jobs quality", icon: ShieldCheck },
  { label: "Warranties", href: "/dashboard/warranties", keywords: "warranties coverage guarantee claims", icon: FileCheck },
  { label: "Billing & Credits", href: "/dashboard/billing", keywords: "billing credits purchase payment invoices", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", keywords: "settings profile password api keys webhooks notifications", icon: Settings },
  { label: "Help & Support", href: "/dashboard/help", keywords: "help support tickets contact faq", icon: LifeBuoy },
];

type Listener = (open: boolean) => void;
let paletteOpen = false;
const listeners = new Set<Listener>();

function setOpen(open: boolean) {
  paletteOpen = open;
  for (const listener of listeners) listener(open);
}

/** Open the dashboard command palette from anywhere (e.g. the topbar search button). */
export function openCommandPalette() {
  setOpen(true);
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpenState] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const listener: Listener = (value) => setOpenState(value);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!paletteOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q),
    );
  }, [query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[18vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && filtered[activeIndex]) {
                e.preventDefault();
                go(filtered[activeIndex].href);
              }
            }}
            placeholder="Go to page…"
            aria-label="Search pages"
            className="h-12 w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-zinc-500">No matching pages</li>
          )}
          {filtered.map((item, index) => (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => go(item.href)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-violet-600/15 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", index === activeIndex ? "text-violet-400" : "text-zinc-500")} />
                <span className="flex-1">{item.label}</span>
                {index === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-zinc-500" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
