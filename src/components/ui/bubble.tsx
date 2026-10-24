import * as React from "react";
import { cn } from "@/lib/utils";

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  sender?: string;
  timestamp?: string;
  isHighlighted?: boolean;
  messageId?: string;
  isCurrentUser?: boolean;
}

export const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  (
    {
      className,
      sender,
      timestamp,
      isHighlighted = false,
      messageId,
      isCurrentUser = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id={messageId ? `bubble-${messageId}` : undefined}
        className={cn(
          "relative flex flex-col space-y-1 transition-all duration-150 p-3 rounded-[16px] text-xs",
          isCurrentUser
            ? "ml-auto bg-[var(--accent)] text-white rounded-tr-xs"
            : "mr-auto bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border-subtle)] rounded-tl-xs",
          isHighlighted &&
            "ring-2 ring-[var(--accent)] border-[var(--accent)] bg-[var(--accent-tint)]",
          className
        )}
        {...props}
      >
        {(sender || timestamp) && (
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono opacity-80 mb-0.5">
            {sender && <span className="font-bold tracking-tight">{sender}</span>}
            {timestamp && <span>{timestamp}</span>}
          </div>
        )}
        <div className="leading-relaxed select-text whitespace-pre-wrap font-sans">
          {children}
        </div>
      </div>
    );
  }
);
Bubble.displayName = "Bubble";
