"use client";

import React, { useState } from "react";
import { useDashboard, TaskItem } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { Check, X, Edit2, MessageSquare, ChevronDown, Search, Calendar } from "lucide-react";

export default function TodoPage() {
  const { state, toggleTaskDone, dismissTask, editTask, openViewerForMessage } = useDashboard();
  const [filter, setFilter] = useState<"all" | "open" | "done" | "uncertain">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [editDateText, setEditDateText] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [pendingDismissTask, setPendingDismissTask] = useState<TaskItem | null>(null);

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  // Filter tasks
  const filteredTasks = state.tasks.filter((t) => {
    if (t.status === "dismissed") return false;
    if (filter === "open" && t.status !== "open") return false;
    if (filter === "done" && t.status !== "done") return false;
    if (filter === "uncertain" && !t.isUncertain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchQuote = t.source_quote.toLowerCase().includes(q);
      const matchDate = (t.datePhrase || "").toLowerCase().includes(q);
      if (!matchTitle && !matchQuote && !matchDate) return false;
    }
    return true;
  });

  // Sort by urgency (urgent / overdue first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return 0;
  });

  const displayedTasks = sortedTasks.slice(0, visibleCount);
  const hasMore = sortedTasks.length > visibleCount;

  const handleStartEdit = (task: TaskItem) => {
    setEditingId(task.id);
    setEditTitleText(task.title);
    setEditDateText(task.datePhrase || "");
  };

  const handleSaveEdit = (taskId: string) => {
    editTask(taskId, editTitleText, editDateText);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Filter Tabs & Search Bar with InputGroup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="inline-flex p-1 rounded-[12px] bg-[var(--card-bg)] border border-[var(--border-subtle)] text-xs font-semibold shrink-0">
          <button
            onClick={() => { setFilter("open"); setVisibleCount(5); }}
            className={`px-3 py-1.5 rounded-[9px] transition-colors cursor-pointer ${
              filter === "open" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
          >
            Open ({state.tasks.filter((t) => t.status === "open").length})
          </button>
          <button
            onClick={() => { setFilter("done"); setVisibleCount(5); }}
            className={`px-3 py-1.5 rounded-[9px] transition-colors cursor-pointer ${
              filter === "done" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
          >
            Done ({state.tasks.filter((t) => t.status === "done").length})
          </button>
          <button
            onClick={() => { setFilter("uncertain"); setVisibleCount(5); }}
            className={`px-3 py-1.5 rounded-[9px] transition-colors cursor-pointer ${
              filter === "uncertain" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
          >
            Date Unclear ({state.tasks.filter((t) => t.isUncertain).length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:max-w-xs">
          <InputGroup>
            <InputGroupAddon align="start">
              <Search className="w-3.5 h-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by text or date..."
            />
          </InputGroup>

          <span className="text-xs font-mono text-[var(--muted)] shrink-0 hidden sm:inline">
            {displayedTasks.length}/{sortedTasks.length}
          </span>
        </div>
      </div>

      {/* Task Cards List */}
      {displayedTasks.length === 0 ? (
        <Card interactive={false} className="p-8 text-center text-xs text-[var(--muted)]">
          {searchQuery ? `No tasks found matching "${searchQuery}".` : "No tasks found in this view."}
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedTasks.map((task) => (
            <Card
              key={task.id}
              className={`p-5 space-y-3 ${task.status === "done" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  {editingId === task.id ? (
                    <div className="space-y-2.5">
                      <InputGroup>
                        <InputGroupAddon align="start">
                          <Edit2 className="w-3.5 h-3.5" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          placeholder="Task title..."
                        />
                      </InputGroup>

                      <InputGroup>
                        <InputGroupAddon align="start">
                          <Calendar className="w-3.5 h-3.5" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="text"
                          value={editDateText}
                          onChange={(e) => setEditDateText(e.target.value)}
                          placeholder="Due date phrase (e.g. tomorrow, 18th Oct)..."
                        />
                      </InputGroup>

                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={() => handleSaveEdit(task.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm font-bold text-[var(--foreground)] ${
                            task.status === "done" ? "line-through text-[var(--muted)]" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.isOverdue && (
                          <Badge variant="overdue">Overdue</Badge>
                        )}
                        {task.isUncertain && (
                          <Badge variant="neutral">Date unclear</Badge>
                        )}
                        {task.wasUpdated && (
                          <Badge variant="secondary">Updated</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-[var(--foreground)]">
                          {task.datePhrase || "Unspecified"}
                        </span>
                        <span className="text-[var(--muted)]">•</span>
                        <span className="text-[var(--muted)] capitalize">
                          Confidence: {task.confidence}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Actions: Confirm, Edit, Dismiss */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleTaskDone(task.id)}
                    className={`p-1.5 rounded-[9px] border border-[var(--border-subtle)] transition-colors cursor-pointer ${
                      task.status === "done"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "hover:bg-[var(--accent-tint)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    title={task.status === "done" ? "Mark incomplete" : "Confirm completion"}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartEdit(task)}
                    className="p-1.5 rounded-[9px] border border-[var(--border-subtle)] hover:bg-[var(--accent-tint)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPendingDismissTask(task)}
                    className="p-1.5 rounded-[9px] border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition-colors cursor-pointer"
                    title="Dismiss task"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slim rounded time-left bar */}
              <div className="w-full bg-[var(--muted-light)] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    task.isUrgent
                      ? "bg-rose-500 w-3/4 animate-pulse"
                      : task.isOverdue
                      ? "bg-red-500 w-full"
                      : "bg-[var(--accent)] w-1/2"
                  }`}
                />
              </div>

              {/* Source quote in mono + View message link */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <p className="font-mono text-[10px] text-[var(--muted)] truncate max-w-lg">
                  &ldquo;{task.source_quote}&rdquo;
                </p>

                <button
                  onClick={() => openViewerForMessage(task.source_message_ids[0])}
                  className="text-[var(--accent)] hover:underline font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>View message</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Show more button if > 5 items */}
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

      {/* AlertDialog for Dismissing a Task */}
      <AlertDialog
        open={!!pendingDismissTask}
        onOpenChange={(open) => !open && setPendingDismissTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss &ldquo;{pendingDismissTask?.title}&rdquo;? It will be removed from your active task view. You can reverse this anytime with Undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDismissTask) {
                  dismissTask(pendingDismissTask.id);
                  setPendingDismissTask(null);
                }
              }}
            >
              Dismiss task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
