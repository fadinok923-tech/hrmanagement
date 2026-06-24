"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="tanoor-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#tanoor-logo)" />
      <rect x="20" y="14" width="24" height="7" rx="3.5" fill="#fff" />
      <rect x="18" y="18" width="28" height="34" rx="5" fill="#fff" />
      <rect x="24" y="27" width="16" height="3" rx="1.5" fill="#1E3A8A" />
      <rect x="24" y="34" width="16" height="3" rx="1.5" fill="#1E3A8A" />
      <rect x="24" y="41" width="10" height="3" rx="1.5" fill="#F59E0B" />
    </svg>
  );
}
