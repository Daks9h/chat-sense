"use client";

import React, { useState } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bubble } from "@/components/ui/bubble";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import { History, MessageSquare, ChevronDown } from "lucide-react";

export default function ChangesPage() {
  const { state, openViewerForMessage } = useDashboard();
  const [visibleCount, setVisibleCount] = useState(5);

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  const displayedChanges = state.changes.slice(0, visibleCount);
  const hasMore = state.changes.length > visibleCount;

  return (
    <div className="space-y-6 animate-fade-up">
      <Alert variant="info" className="py-2.5">
        <History className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <AlertTitle className="text-xs">Precedence Override Engine</AlertTitle>
          <AlertDescription className="text-[11px]">
            When senders postpone dates or modify requirements in follow-up messages, the latest timestamp takes precedence.
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <span className="text-xs font-mono text-[var(--muted)]">
          Latest message always takes precedence
        </span>
        <span className="text-xs font-mono text-[var(--muted)]">
          {state.changes.length} {state.changes.length === 1 ? "correction" : "corrections"} detected
        </span>
      </div>

      {displayedChanges.length === 0 ? (
        <Card interactive={false} className="p-8 text-center text-xs text-[var(--muted)]">
          No corrections or moved deadlines found in this chat.
        </Card>
      ) : (
        <div className="relative border-l-2 border-[var(--border-subtle)] ml-4 pl-6 space-y-6 my-4">
          {displayedChanges.map((change) => (
            <div key={change.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-[var(--accent)] border-4 border-[var(--background)] shadow-xs" />

              <Card className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      {change.taskTitle}
                    </h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      {change.explanation}
                    </p>
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    Correction
                  </Badge>
                </div>

                {/* Diff banner: "Old -> New" in mono */}
                <div className="p-3 rounded-[12px] bg-[var(--background)]/70 border border-[var(--border-subtle)] font-mono text-xs flex items-center gap-3">
                  <span className="line-through text-[var(--muted)]">{change.oldValue}</span>
                  <span className="text-[var(--accent)] font-bold">&rarr;</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{change.newValue}</span>
                </div>

                {/* Ground Truth WhatsApp Chat Bubble */}
                <Bubble
                  sender={change.messageSender}
                  timestamp={change.messageTimestamp}
                  messageId={change.source_message_ids[0]}
                  className="bg-[var(--background)]/90 border border-[var(--border-subtle)] max-w-full"
                >
                  {change.source_quote}
                </Bubble>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted)] font-mono text-[10px]">
                    Verified ground truth #{change.source_message_ids[0]}
                  </span>

                  <button
                    onClick={() => openViewerForMessage(change.source_message_ids[0])}
                    className="text-[var(--accent)] hover:underline font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>View in context</span>
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="inline-flex items-center gap-1.5"
          >
            <span>Show more</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
