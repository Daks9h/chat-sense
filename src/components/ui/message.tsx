import * as React from "react";
import { cn } from "@/lib/utils";
import { Bubble } from "@/components/ui/bubble";
import { Badge } from "@/components/ui/badge";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  sender: string;
  timestamp: string;
  text: string;
  isHighlighted?: boolean;
  onInspectQuote?: () => void;
  badge?: string;
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    {
      className,
      id,
      sender,
      timestamp,
      text,
      isHighlighted = false,
      onInspectQuote,
      badge,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id={`msg-${id}`}
        className={cn("group relative flex flex-col space-y-1.5", className)}
        {...props}
      >
        <Bubble
          sender={sender}
          timestamp={timestamp}
          isHighlighted={isHighlighted}
          messageId={id}
        >
          {text}
        </Bubble>

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[var(--muted)]">
          <span className="font-semibold text-[var(--accent)]">#{id}</span>
          {badge && <Badge variant="secondary" className="text-[9px] py-0">{badge}</Badge>}
          {onInspectQuote && (
            <button
              onClick={onInspectQuote}
              className="text-[var(--accent)] hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
            >
              Inspect evidence &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";
