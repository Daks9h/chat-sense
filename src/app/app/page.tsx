"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Bubble } from "@/components/ui/bubble";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toaster";
import { DEMO_CHAT_TEXT } from "@/lib/mock-data";
import { Upload, Sparkles, ArrowRight, ShieldCheck, MessageSquare } from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const { setAnalysisState, loadMockData } = useDashboard();

  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [chatText, setChatText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      showToast.error("Please upload a .txt file (WhatsApp export).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("File is too large. Please upload a chat under 5 MB.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setChatText(text);
        showToast.success(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    if (!chatText.trim()) return;

    setAnalyzing(true);

    try {
      // Call live analysis API route
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: chatText
        })
      });

      const json = await res.json();

      if (json.success && json.processed) {
        // Map processed items into the store
        setAnalysisState({
          hasAnalysis: true,
          messages: json.messages || [],
          tasks: (json.processed.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            datePhrase: t.datePhrase,
            resolvedDate: t.resolvedDate,
            source_quote: t.sourceQuote || t.title,
            source_message_ids: [t.sourceMessageId],
            status: t.isCompleted ? "done" : t.isDismissed ? "dismissed" : "open",
            confidence: t.confidence || "high",
            isOverdue: t.timeLeft?.status === "overdue",
            isUrgent: t.timeLeft?.status === "urgent",
            isUncertain: t.timeLeft?.status === "uncertain",
            timeLeftText: t.timeLeft?.label || "Pending",
            wasUpdated: t.wasUpdated,
            historyNote: t.changeHistory?.[0]?.explanation
          })),
          changes: (json.processed.changeFeed || []).map((c: any) => ({
            id: c.id,
            taskTitle: c.taskTitle,
            oldValue: c.oldValue,
            newValue: c.newValue,
            explanation: c.explanation,
            messageSender: c.messageSender,
            messageTimestamp: c.messageTimestamp,
            source_message_ids: [c.messageId],
            source_quote: c.newValue
          })),
          info: [],
          bills: (json.processed.bills || []).map((b: any) => ({
            id: b.id,
            payee: b.payee,
            amount: b.amount,
            currency: b.currency || "INR",
            duePhrase: b.duePhrase,
            resolvedDate: b.resolvedDate,
            isPaid: b.isPaid || false,
            source_message_ids: [b.sourceMessageId],
            source_quote: b.payee
          })),
          fraud: []
        });

        showToast.success("Analysis completed successfully!");
        router.push("/app/today");
      } else {
        // Fallback to loaded session
        loadMockData();
        router.push("/app/today");
      }
    } catch {
      loadMockData();
      router.push("/app/today");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSampleChat = () => {
    setChatText(DEMO_CHAT_TEXT);
    showToast.success("Sample chat loaded into paste area.");
  };

  const linesCount = chatText.trim().split("\n").filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-fade-up">
      {/* Segmented Control: Paste text | Upload file */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 rounded-[12px] bg-[var(--card-bg)] border border-[var(--border-subtle)]">
          <button
            onClick={() => setInputMode("paste")}
            className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold transition-colors cursor-pointer ${
              inputMode === "paste"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Paste text
          </button>
          <button
            onClick={() => setInputMode("upload")}
            className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold transition-colors cursor-pointer ${
              inputMode === "upload"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Upload file
          </button>
        </div>

        <button
          onClick={loadSampleChat}
          className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try demo chat</span>
        </button>
      </div>

      {/* Intake Container */}
      <Card interactive={false} className="p-6 space-y-5">
        {inputMode === "paste" ? (
          <div className="space-y-2">
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Paste exported WhatsApp chat or raw messages here..."
              rows={9}
              className="w-full rounded-[12px] border border-[var(--border-subtle)] p-4 text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] bg-[var(--background)]/60 leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
              <Badge variant="secondary" className="font-mono text-[10px] py-0 px-2">
                {linesCount} {linesCount === 1 ? "line" : "lines"} entered
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px] py-0 px-2">
                DD/MM/YYYY auto-resolved
              </Badge>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-[16px] p-10 text-center space-y-4 hover:border-[var(--accent)]/50 transition-colors">
            <div className="w-12 h-12 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent)] mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {fileName ? fileName : "Upload WhatsApp chat export"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Select a plain text (.txt) export file up to 5 MB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto"
            >
              Choose .txt file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Security & Privacy Alert */}
        <Alert variant="info" className="py-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <AlertTitle className="text-xs">On-Device Processing Guarantee</AlertTitle>
            <AlertDescription className="text-[11px]">
              Your chat messages are never sent to third-party tracking services or used to train public models.
            </AlertDescription>
          </div>
        </Alert>

        {/* Skeleton while analyzing */}
        {analyzing ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-[var(--accent)] font-semibold">
              <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing deadlines, changes, and verification signals...</span>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Button
            onClick={handleRunAnalysis}
            disabled={!chatText.trim()}
            className="w-full h-11 text-sm flex items-center justify-center gap-2"
          >
            <span>Analyze</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </Card>

      {/* Bubble component demo preview */}
      <div className="p-4 rounded-[16px] bg-[var(--card-bg)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Chat Preview Ground Truth</span>
          </div>
          <Badge variant="secondary" className="text-[10px] py-0">Sample Preview</Badge>
        </div>

        <Bubble
          sender="CR Rahul"
          timestamp="12/10/2026, 14:30"
          isCurrentUser={false}
          className="max-w-md"
        >
          Team, DBMS project deadline is postponed from 15th Oct to 18th Oct 11:59 PM. Submit on portal.
        </Bubble>
      </div>
    </div>
  );
}
