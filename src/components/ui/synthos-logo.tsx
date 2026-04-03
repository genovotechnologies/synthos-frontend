"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface SynthosLogoProps {
  className?: string;
  size?: number;
}

export function SynthosLogo({ className, size = 32 }: SynthosLogoProps) {
  return (
    <Image
      src="/synthos-logo-icon.jpeg"
      alt="Synthos"
      width={size}
      height={size}
      className={cn("flex-shrink-0 rounded-md", className)}
      priority
    />
  );
}

export function SynthosLogoWithText({
  className,
  logoSize = 32,
  showTagline = false
}: {
  className?: string;
  logoSize?: number;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SynthosLogo size={logoSize} />
      <div className="flex flex-col">
        <span className="font-semibold text-lg text-white leading-tight tracking-wide">SYNTHOS</span>
        {showTagline && (
          <span className="text-[10px] text-white/50 tracking-widest uppercase leading-tight">A Genovo Technologies Company</span>
        )}
      </div>
    </div>
  );
}
