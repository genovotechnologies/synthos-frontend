"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

function addToast(variant: ToastVariant, title: string, description?: string) {
  const id = nextId++;
  toasts = [...toasts, { id, variant, title, description }];
  emit();
  window.setTimeout(() => dismissToast(id), 5000);
  return id;
}

export function dismissToast(id: number) {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, description?: string) => addToast("success", title, description),
  error: (title: string, description?: string) => addToast("error", title, description),
  info: (title: string, description?: string) => addToast("info", title, description),
};

const variantStyles: Record<ToastVariant, { icon: typeof Info; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-400", barClass: "bg-emerald-500" },
  error: { icon: AlertCircle, iconClass: "text-rose-400", barClass: "bg-rose-500" },
  info: { icon: Info, iconClass: "text-violet-400", barClass: "bg-violet-500" },
};

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Toaster() {
  const items = React.useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  );
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {items.map((item) => {
        const { icon: Icon, iconClass, barClass } = variantStyles[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 pr-10 shadow-xl shadow-black/40 backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <span className={cn("absolute inset-y-0 left-0 w-0.5", barClass)} />
            <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", iconClass)} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(item.id)}
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
