"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger renders a rose confirm button; default renders violet */
  variant?: "danger" | "default";
  /** Show a required textarea and pass its value to onConfirm */
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  requireReason = false,
  reasonPlaceholder = "Provide a reason…",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = React.useState("");
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const confirmDisabled = loading || (requireReason && !reason.trim());

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          {variant === "danger" && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-zinc-100">
              {title}
            </h2>
            {description && (
              <div className="mt-1.5 text-sm leading-relaxed text-zinc-400">{description}</div>
            )}
          </div>
        </div>

        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={3}
            disabled={loading}
            className="mt-4 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
            disabled={confirmDisabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-violet-600 hover:bg-violet-500",
            )}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
