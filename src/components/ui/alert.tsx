import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "neutral" | "info";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--border-subtle)]",
      destructive: "bg-[var(--verdict-high-risk-bg)] text-[var(--verdict-high-risk-text)] border-[var(--verdict-high-risk-border)]",
      warning: "bg-[var(--verdict-suspicious-bg)] text-[var(--verdict-suspicious-text)] border-[var(--verdict-suspicious-border)]",
      neutral: "bg-[var(--verdict-neutral-bg)] text-[var(--verdict-neutral-text)] border-[var(--verdict-neutral-border)]",
      info: "bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--border-subtle)]",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-[16px] border p-4 text-xs leading-relaxed flex items-start gap-3",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-heading font-bold text-sm tracking-tight mb-1 text-inherit", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
