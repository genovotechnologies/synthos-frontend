"use client";

import { cn } from "@/lib/utils";

interface SynthosLogoProps {
  className?: string;
  size?: number;
}

export function SynthosLogo({ className, size = 32 }: SynthosLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      {/* Background diamond shapes with transparency */}
      <defs>
        <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="logoGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="sGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      
      {/* Outer diamond shape - rotated square */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="8"
        transform="rotate(45 50 50)"
        fill="url(#logoGradient1)"
      />
      
      {/* Inner diamond shape */}
      <rect
        x="22"
        y="22"
        width="56"
        height="56"
        rx="6"
        transform="rotate(45 50 50)"
        fill="url(#logoGradient2)"
      />
      
      {/* S shape - stylized curve */}
      <path
        d="M62 28C62 28 70 32 70 42C70 52 50 50 50 50C50 50 30 48 30 58C30 68 38 72 50 72C62 72 70 68 70 68"
        stroke="url(#sGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Inner white highlight on S */}
      <path
        d="M62 28C62 28 70 32 70 42C70 52 50 50 50 50C50 50 30 48 30 58C30 68 38 72 50 72C62 72 70 68 70 68"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
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
    <div className={cn("flex items-center gap-2", className)}>
      <SynthosLogo size={logoSize} />
      <div className="flex flex-col">
        <span className="font-semibold text-lg text-white leading-tight">Synthos</span>
        {showTagline && (
          <span className="text-xs text-white/50 font-mono leading-tight">A Genovo Technologies Company</span>
        )}
      </div>
    </div>
  );
}
