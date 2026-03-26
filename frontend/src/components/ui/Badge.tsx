/**
 * Badge.tsx
 *
 * Small semantic badge with lightweight variants for status display.
 */

import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "success" | "danger" | "warning" | "info";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  neutral: "bg-slate-800 text-slate-200 border-slate-700",
  success: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
  danger: "bg-rose-500/15 text-rose-200 border-rose-400/35",
  warning: "bg-amber-500/15 text-amber-200 border-amber-400/35",
  info: "bg-cyan-500/15 text-cyan-200 border-cyan-400/35",
};

function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
