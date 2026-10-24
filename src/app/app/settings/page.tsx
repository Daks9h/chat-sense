"use client";

import React, { useState } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { showToast } from "@/components/ui/toaster";
import { ThemeToggle } from "@/components/theme-toggle";
import { Trash2, Download, Cpu, ShieldAlert, AlertTriangle, Calendar, Tag } from "lucide-react";

export default function SettingsPage() {
  const { state, clearAllData } = useDashboard();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [calendarTag, setCalendarTag] = useState("ChatSense Deadlines");

  // Export deadlines as .ics iCalendar file
  const exportICS = () => {
    const tasksWithDates = state.tasks.filter((t) => t.status === "open" && t.resolvedDate);
    if (tasksWithDates.length === 0) {
      showToast.error("No scheduled tasks with dates available to export.");
      return;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//ChatSense//${calendarTag || "Action Intelligence"}//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    tasksWithDates.forEach((t) => {
      const dt = new Date(t.resolvedDate!);
      // Format as YYYYMMDDTHHMMSSZ
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dtStr = `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(
        dt.getUTCHours()
      )}${pad(dt.getUTCMinutes())}00Z`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${t.id}@chatsense.local`,
        `DTSTAMP:${dtStr}`,
        `DTSTART:${dtStr}`,
        `SUMMARY:[${calendarTag || "ChatSense"}] ${t.title.replace(/[,;]/g, " ")}`,
        `DESCRIPTION:Extracted via ChatSense from chat: ${t.source_quote.replace(/[\r\n]/g, " ")}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "chatsense-deadlines.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`Exported ${tasksWithDates.length} deadlines to .ics calendar file.`);
  };

  const handleConfirmedClear = () => {
    clearAllData();
    setConfirmClearOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      {/* 1. Theme Configuration */}
      <Card interactive={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-heading text-[var(--foreground)]">
              Appearance Theme
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Switch between daylight and darkroom mode.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* 2. Calendar Export */}
      <Card interactive={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-heading text-[var(--foreground)]">
              Export Deadlines (.ics)
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Download standard calendar events for Google Calendar, Apple Calendar, or Outlook.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportICS} className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Download .ics</span>
          </Button>
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--muted)] block">
            Calendar Category Prefix
          </label>
          <InputGroup>
            <InputGroupAddon align="start">
              <Tag className="w-3.5 h-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              value={calendarTag}
              onChange={(e) => setCalendarTag(e.target.value)}
              placeholder="Custom calendar category tag..."
            />
          </InputGroup>
        </div>
      </Card>

      {/* 3. Model Engine Information (Read-only from env) */}
      <Card interactive={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold font-heading text-[var(--foreground)]">
                Active AI Model
              </h3>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Inference engine used for structured chat extraction.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            gemini-3.1-flash-lite-preview
          </Badge>
        </div>
      </Card>

      {/* 4. Local Privacy Alert */}
      <Alert variant="info">
        <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <AlertTitle>Local Storage Safeguard</AlertTitle>
          <AlertDescription>
            All extracted chat cards, verified quotes, and timelines are cached exclusively in your local browser sandbox.
          </AlertDescription>
        </div>
      </Alert>

      {/* 5. Clear All Data */}
      <Card interactive={false} className="p-6 space-y-4 border-rose-500/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-heading text-rose-600 dark:text-rose-400">
              Clear All Stored Data
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Permanently purges all parsed chats, tasks, bills, and undo history from localStorage.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear data</span>
          </Button>
        </div>
      </Card>

      {/* Radix Alert Dialog for Confirmation */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <AlertDialogTitle>Clear All Workspace History?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. All parsed action cards, change feeds, and messages stored in this browser session will be completely deleted from localStorage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmedClear}>
              Confirm and purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
