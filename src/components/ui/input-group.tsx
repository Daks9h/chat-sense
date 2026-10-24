import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg";
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, size = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--card-bg)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InputGroup.displayName = "InputGroup";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }
>(({ className, align = "start", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center text-[var(--muted)] px-3 text-xs shrink-0 select-none",
        align === "start" ? "pl-3.5 pr-2" : "pr-3.5 pl-2",
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-transparent py-2 px-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

export { InputGroup, InputGroupAddon, InputGroupInput };
