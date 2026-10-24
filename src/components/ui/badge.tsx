import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "high-risk" | "suspicious" | "neutral" | "urgent" | "overdue";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-[var(--accent)] text-white border-transparent",
    secondary: "bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--border-subtle)]",
    outline: "border-[var(--border-subtle)] text-[var(--foreground)]",
    "high-risk": "bg-[var(--verdict-high-risk-bg)] text-[var(--verdict-high-risk-text)] border-[var(--verdict-high-risk-border)]",
    suspicious: "bg-[var(--verdict-suspicious-bg)] text-[var(--verdict-suspicious-text)] border-[var(--verdict-suspicious-border)]",
    neutral: "bg-[var(--verdict-neutral-bg)] text-[var(--verdict-neutral-text)] border-[var(--verdict-neutral-border)]",
    urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-bold",
    overdue: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
