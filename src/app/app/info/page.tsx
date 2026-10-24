"use client";

import React, { useState } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import { Search, MessageSquare, Info } from "lucide-react";

export default function InfoPage() {
  const { state, openViewerForMessage } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  const filteredInfo = state.info.filter(
    (item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Filter and Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <InputGroup>
            <InputGroupAddon align="start">
              <Search className="w-4 h-4 text-[var(--muted)]" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter notices, room numbers, contacts..."
            />
          </InputGroup>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {filteredInfo.length} {filteredInfo.length === 1 ? "notice" : "notices"}
          </Badge>
        </div>
      </div>

      {filteredInfo.length === 0 ? (
        searchTerm ? (
          <Alert variant="neutral">
            <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <AlertTitle>No Matching Notices</AlertTitle>
              <AlertDescription>
                No notices or announcements matched your filter query &ldquo;{searchTerm}&rdquo;.
              </AlertDescription>
            </div>
          </Alert>
        ) : (
          <Card interactive={false} className="p-8 text-center text-xs text-[var(--muted)]">
            No factual notices extracted from this session.
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInfo.map((item) => (
            <Card key={item.id} className="p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-[var(--accent)]">
                    {item.label}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--foreground)] leading-relaxed font-medium">
                  {item.value}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--muted)] font-mono text-[10px] truncate max-w-[140px]">
                  &ldquo;{item.source_quote}&rdquo;
                </span>

                <button
                  onClick={() => openViewerForMessage(item.source_message_ids[0])}
                  className="text-[var(--accent)] hover:underline font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>View quote</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
