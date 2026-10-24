"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Bubble } from "@/components/ui/bubble";
import { EmptyState } from "@/components/empty-state";
import { Clock, AlertTriangle, ShieldAlert, ArrowRight, MessageSquare } from "lucide-react";

export default function TodayPage() {
  const { state, openViewerForMessage } = useDashboard();

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  const overdueTasks = state.tasks.filter((t) => t.isOverdue && t.status === "open");
  const dueTodayTasks = state.tasks.filter((t) => t.isUrgent && t.status === "open");
  const suspiciousCount = state.fraud.filter((f) => f.verdict !== "No red flags found").length;
  const nextDeadlines = state.tasks
    .filter((t) => t.status === "open")
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Alert Banner for Overdue or Due Today Items */}
      {overdueTasks.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle>Action Required: {overdueTasks.length} Overdue {overdueTasks.length === 1 ? "Item" : "Items"}</AlertTitle>
            <AlertDescription>
              Deadlines have elapsed. Review and confirm completion or update dates in your To-do workspace.
            </AlertDescription>
          </div>
        </Alert>
      ) : dueTodayTasks.length > 0 ? (
        <Alert variant="warning">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle>{dueTodayTasks.length} {dueTodayTasks.length === 1 ? "Action" : "Actions"} Due Today</AlertTitle>
            <AlertDescription>
              Time-sensitive submissions or dues require your attention today.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {/* Three short rows: Due today, Overdue, Suspicious messages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1: Due Today */}
        <Link href="/app/todo" className="block group">
          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[var(--muted)] font-medium">Due Today</span>
              <p className="font-heading text-2xl font-bold text-[var(--foreground)]">
                {dueTodayTasks.length} {dueTodayTasks.length === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Clock className="w-5 h-5 stroke-[1.75]" />
            </div>
          </Card>
        </Link>

        {/* Row 2: Overdue */}
        <Link href="/app/todo" className="block group">
          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[var(--muted)] font-medium">Overdue Actions</span>
              <p className="font-heading text-2xl font-bold text-red-600 dark:text-red-400">
                {overdueTasks.length} {overdueTasks.length === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-5 h-5 stroke-[1.75]" />
            </div>
          </Card>
        </Link>

        {/* Row 3: Suspicious Alerts */}
        <Link href="/app/fraud" className="block group">
          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[var(--muted)] font-medium">Flagged Alerts</span>
              <p className="font-heading text-2xl font-bold text-rose-600 dark:text-rose-400">
                {suspiciousCount} {suspiciousCount === 1 ? "alert" : "alerts"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
              <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Next 3 Deadlines with Slim Time-Left Bars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[var(--foreground)]">
            Next Deadlines
          </h2>
          <Link
            href="/app/todo"
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <span>View all to-dos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nextDeadlines.length === 0 ? (
          <Card interactive={false} className="p-6 text-center text-xs text-[var(--muted)]">
            No upcoming deadlines recorded.
          </Card>
        ) : (
          <div className="space-y-3">
            {nextDeadlines.map((task) => (
              <Card key={task.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--foreground)]">
                        {task.title}
                      </h3>
                      {task.wasUpdated && (
                        <Badge variant="secondary" className="text-[10px]">
                          Updated
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[var(--muted)]">
                      Due: {task.datePhrase || "Date unclear"}
                    </p>
                  </div>

                  <Badge
                    variant={
                      task.isUrgent ? "urgent" : task.isOverdue ? "overdue" : "secondary"
                    }
                  >
                    {task.timeLeftText}
                  </Badge>
                </div>

                {/* Slim rounded time-left bar */}
                <div className="w-full bg-[var(--muted-light)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      task.isUrgent
                        ? "bg-rose-500 w-3/4 animate-pulse"
                        : task.isOverdue
                        ? "bg-red-500 w-full"
                        : "bg-[var(--accent)] w-1/3"
                    }`}
                  />
                </div>

                {/* Chat Bubble for Ground Truth Evidence */}
                <Bubble
                  sender="Source Chat Snippet"
                  timestamp={task.datePhrase || undefined}
                  messageId={task.source_message_ids[0]}
                  className="bg-[var(--background)]/70 text-[var(--foreground)] border border-[var(--border-subtle)]"
                >
                  &ldquo;{task.source_quote}&rdquo;
                </Bubble>

                <div className="flex items-center justify-end pt-1 text-[11px]">
                  <button
                    onClick={() => openViewerForMessage(task.source_message_ids[0])}
                    className="text-[var(--accent)] hover:underline font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View in message history &rarr;</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
