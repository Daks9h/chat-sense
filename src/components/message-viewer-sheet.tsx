"use client";

import React, { useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { Message } from "@/components/ui/message";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/lib/dashboard-store";
import { MessageSquare, X } from "lucide-react";

export function MessageViewerSheet() {
  const { state, selectedMessageId, viewerSheetOpen, closeViewer } = useDashboard();
  const activeMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewerSheetOpen && selectedMessageId) {
      setTimeout(() => {
        const el = document.getElementById(`msg-${selectedMessageId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  }, [viewerSheetOpen, selectedMessageId]);

  return (
    <Drawer open={viewerSheetOpen} onOpenChange={(open) => !open && closeViewer()}>
      <DrawerContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
        <DrawerHeader className="p-0 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
              <DrawerTitle>Original Chat Messages</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button
                className="p-1 rounded-[8px] hover:bg-[var(--card-bg-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close message viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </div>
          <DrawerDescription className="mt-1 flex items-center gap-2">
            <span>{state.messages.length} messages in session.</span>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Verbatim Ground Truth</Badge>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {state.messages.length === 0 ? (
            <p className="text-center text-xs text-[var(--muted)] py-12">
              No chat messages loaded yet.
            </p>
          ) : (
            state.messages.map((msg) => {
              const isTarget = selectedMessageId === msg.id;

              return (
                <Message
                  key={msg.id}
                  ref={isTarget ? activeMessageRef : null}
                  id={msg.id}
                  sender={msg.sender}
                  timestamp={msg.timestamp}
                  text={msg.text}
                  isHighlighted={isTarget}
                  badge={isTarget ? "Active Focus" : undefined}
                />
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
