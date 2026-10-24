"use client";

import React from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Trash2, Cpu, ShieldCheck, Database } from "lucide-react";

export default function SettingsPage() {
  const { loadMockData, clearAllData, state } = useDashboard();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      {/* Session Overview */}
      <Card interactive={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h2 className="font-heading text-base font-bold text-[var(--foreground)]">
              Workspace & Storage
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Manage your local browser session data and demo datasets.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {state.messages.length} messages loaded
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-[12px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] font-semibold">Tasks</span>
            <p className="text-lg font-bold text-[var(--foreground)]">{state.tasks.length}</p>
          </div>
          <div className="p-3 rounded-[12px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] font-semibold">Changes</span>
            <p className="text-lg font-bold text-[var(--foreground)]">{state.changes.length}</p>
          </div>
          <div className="p-3 rounded-[12px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] font-semibold">Bills</span>
            <p className="text-lg font-bold text-[var(--foreground)]">{state.bills.length}</p>
          </div>
          <div className="p-3 rounded-[12px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] font-semibold">Alerts</span>
            <p className="text-lg font-bold text-[var(--foreground)]">{state.fraud.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMockData}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Load Demo Data & Produce Results</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllData}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Data</span>
          </Button>
        </div>
      </Card>

      {/* Model & Processing Architecture */}
      <Card interactive={false} className="p-6 space-y-4">
        <div>
          <h2 className="font-heading text-base font-bold text-[var(--foreground)]">
            Active AI & Processing Engine
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Model parameters and extraction architecture.
          </p>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              <span>Model Architecture</span>
            </div>
            <Badge variant="secondary">Gemma 4 26B / Flash</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--background)]/70 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ground Truth Validation</span>
            </div>
            <Badge variant="neutral" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Deterministic Enforced
            </Badge>
          </div>
        </div>

        <Alert variant="info" className="py-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <AlertTitle className="text-xs">Privacy & On-Device Processing</AlertTitle>
            <AlertDescription className="text-[11px]">
              Chat transcripts and parsed action items are held in your browser&apos;s localStorage. We never sell, index, or retain chat data.
            </AlertDescription>
          </div>
        </Alert>
      </Card>

      {/* Appearance Settings */}
      <Card interactive={false} className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-[var(--foreground)]">
              Appearance
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Switch between light and dark themes.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>
    </div>
  );
}
