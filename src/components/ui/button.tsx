import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantStyles = {
      default: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs",
      secondary: "bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] border border-[var(--border-subtle)] text-[var(--foreground)]",
      outline: "border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--foreground)] hover:text-[var(--accent)] bg-transparent",
      ghost: "hover:bg-[var(--accent-tint)] text-[var(--foreground)] hover:text-[var(--accent)]",
      destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 px-3 text-[11px]",
      lg: "h-11 px-6 text-sm",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
