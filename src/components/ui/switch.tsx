"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible label for the switch */
  label?: string;
  /** Tailwind class for the track when on (defaults to violet) */
  activeClass?: string;
  size?: "sm" | "md";
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  activeClass = "bg-violet-600",
  size = "md",
  className,
}: SwitchProps) {
  const dims =
    size === "sm"
      ? { track: "h-5 w-9", thumb: "h-3.5 w-3.5", on: "translate-x-4", off: "translate-x-1" }
      : { track: "h-6 w-11", thumb: "h-4 w-4", on: "translate-x-6", off: "translate-x-1" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
        dims.track,
        checked ? activeClass : "bg-zinc-700",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block transform rounded-full bg-white shadow transition-transform duration-200",
          dims.thumb,
          checked ? dims.on : dims.off,
        )}
      />
    </button>
  );
}
