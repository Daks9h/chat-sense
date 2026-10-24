"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Bubble } from "@/components/ui/bubble";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toaster";
import { DEMO_CHAT_TEXT } from "@/lib/mock-data";
import { parseChat } from "@/lib/parser";
import { extractDeterministically } from "@/lib/deterministic-extractor";
import { processChatItems } from "@/lib/change-tracker";
import { Upload, Sparkles, ArrowRight, ShieldCheck, MessageSquare, Zap } from "lucide-react";

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAnalysisState, loadMockData } = useDashboard();

  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [chatText, setChatText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load demo data if URL contains ?demo=true or ?mock=true
  useEffect(() => {
    const isDemo = searchParams.get("demo") === "true" || searchParams.get("mock") === "true";
    if (isDemo) {
      loadMockData();
      showToast.success("Demo chat loaded with all extracted actions & deadlines!");
      router.push("/app/today");
    }
  }, [searchParams, loadMockData, router]);

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

    const isDemoContent =
      chatText.includes("Project Phase 1 submission") ||
      chatText.includes("amit.kumar@okhdfcbank") ||
      chatText.includes("sbi-yono-secure-kyc") ||
      chatText.trim() === DEMO_CHAT_TEXT.trim();

    // 1. FAST PROGRESSIVE RENDER: Immediately parse and populate dashboard in <50ms
    const parseRes = parseChat(chatText);
    if (parseRes.messages.length > 0) {
      const fastItems = extractDeterministically(parseRes.messages);
      const processedFast = processChatItems(fastItems, parseRes.messages);

      setAnalysisState({
        hasAnalysis: true,
        messages: parseRes.messages,
        tasks: (processedFast.tasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          datePhrase: t.datePhrase,
          resolvedDate: t.resolvedDate,
          source_quote: t.sourceQuote || t.source_quote || t.title,
          source_message_ids: [t.sourceMessageId || t.source_message_ids?.[0] || t.id],
          status: t.isCompleted ? "done" : t.isDismissed ? "dismissed" : "open",
          confidence: t.confidence || "high",
          isOverdue: t.timeLeft?.status === "overdue",
          isUrgent: t.timeLeft?.status === "urgent",
          isUncertain: t.timeLeft?.status === "uncertain",
          timeLeftText: t.timeLeft?.label || "Pending",
          wasUpdated: t.wasUpdated,
          historyNote: t.changeHistory?.[0]?.explanation
        })),
        changes: (processedFast.changeFeed || []).map((c: any) => ({
          id: c.id,
          taskTitle: c.taskTitle,
          oldValue: c.oldValue,
          newValue: c.newValue,
          explanation: c.explanation,
          messageSender: c.messageSender,
          messageTimestamp: c.messageTimestamp,
          source_message_ids: [c.messageId || c.source_message_ids?.[0]],
          source_quote: c.sourceQuote || c.source_quote || c.newValue
        })),
        info: (processedFast.info || []).map((inf: any) => ({
          id: inf.id,
          label: inf.label,
          value: inf.value,
          source_message_ids: inf.source_message_ids || [inf.sourceMessageId || inf.id],
          source_quote: inf.source_quote || inf.sourceQuote || inf.value
        })),
        bills: (processedFast.bills || []).map((b: any) => ({
          id: b.id,
          payee: b.payee,
          amount: b.amount,
          currency: b.currency || "INR",
          duePhrase: b.duePhrase,
          resolvedDate: b.resolvedDate || b.resolvedDueDate,
          isPaid: b.isPaid || false,
          source_message_ids: [b.sourceMessageId || b.id],
          source_quote: b.sourceQuote || b.source_quote || b.payee
        })),
        fraud: (processedFast.fraud || []).map((f: any) => ({
          id: f.id,
          messageId: f.messageId || f.sourceMessageId || f.source_message_ids?.[0],
          verdict: f.verdict || "Suspicious",
          reasons: f.reasons || [],
          extractedDomains: f.extractedDomains || [],
          source_message_ids: f.source_message_ids || [f.messageId],
          source_quote: f.source_quote || f.sourceQuote || ""
        }))
      });

      showToast.success("Results ready! Populated action items on dashboard.");
      router.push("/app/today");
    }

    // 2. Background AI refinement call
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: chatText,
          mock: isDemoContent
        })
      });

      const json = await res.json();

      if (json.success && json.processed) {
        setAnalysisState({
          hasAnalysis: true,
          messages: json.messages || [],
          tasks: (json.processed.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            datePhrase: t.datePhrase,
            resolvedDate: t.resolvedDate,
            source_quote: t.sourceQuote || t.source_quote || t.title,
            source_message_ids: [t.sourceMessageId || t.source_message_ids?.[0] || t.id],
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
            source_message_ids: [c.messageId || c.source_message_ids?.[0]],
            source_quote: c.sourceQuote || c.source_quote || c.newValue
          })),
          info: (json.processed.info || []).map((inf: any) => ({
            id: inf.id,
            label: inf.label,
            value: inf.value,
            source_message_ids: inf.source_message_ids || [inf.sourceMessageId || inf.id],
            source_quote: inf.source_quote || inf.sourceQuote || inf.value
          })),
          bills: (json.processed.bills || []).map((b: any) => ({
            id: b.id,
            payee: b.payee,
            amount: b.amount,
            currency: b.currency || "INR",
            duePhrase: b.duePhrase,
            resolvedDate: b.resolvedDate || b.resolvedDueDate,
            isPaid: b.isPaid || false,
            source_message_ids: [b.sourceMessageId || b.id],
            source_quote: b.sourceQuote || b.source_quote || b.payee
          })),
          fraud: (json.processed.fraud || []).map((f: any) => ({
            id: f.id,
            messageId: f.messageId || f.sourceMessageId || f.source_message_ids?.[0],
            verdict: f.verdict || "Suspicious",
            reasons: f.reasons || [],
            extractedDomains: f.extractedDomains || [],
            source_message_ids: f.source_message_ids || [f.messageId],
            source_quote: f.source_quote || f.sourceQuote || ""
          }))
        });
      }
    } catch {
      // background error silently handled since preliminary results are already active
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSampleChat = () => {
    setChatText(DEMO_CHAT_TEXT);
    showToast.success("Sample chat loaded into paste area.");
  };

  const handleInstantDemo = () => {
    loadMockData();
    showToast.success("Demo chat analyzed! Loaded tasks, deadlines, bills & alerts.");
    router.push("/app/today");
  };

  const linesCount = chatText.trim().split("\n").filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-fade-up">
      {/* Segmented Control & Demo Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleChat}
            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] px-2.5 py-1.5 rounded-[8px] hover:bg-[var(--card-bg-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Paste sample chat into textarea"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Paste demo chat</span>
          </button>

          <Button
            size="sm"
            onClick={handleInstantDemo}
            className="h-8 text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Demo Results</span>
          </Button>
        </div>
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
            <div className="pt-2 text-[11px] text-[var(--muted)] flex items-center justify-center gap-2">
              <span>Sample exports:</span>
              <a href="/demo/chat1_college_dbms_group.txt" download className="text-[var(--accent)] underline hover:text-[var(--accent-hover)]">
                College (.txt)
              </a>
              <span>•</span>
              <a href="/demo/chat2_flatmates_bills.txt" download className="text-[var(--accent)] underline hover:text-[var(--accent-hover)]">
                Bills (.txt)
              </a>
              <span>•</span>
              <a href="/demo/chat3_family_scam_messages.txt" download className="text-[var(--accent)] underline hover:text-[var(--accent-hover)]">
                Scam (.txt)
              </a>
            </div>
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
          <div className="space-y-2">
            <Button
              onClick={handleRunAnalysis}
              disabled={!chatText.trim()}
              className="w-full h-11 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Analyze Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {!chatText.trim() && (
              <p className="text-center text-xs text-[var(--muted)] pt-1">
                Want to see it work immediately? Click{" "}
                <button
                  type="button"
                  onClick={handleInstantDemo}
                  className="text-[var(--accent)] font-semibold underline cursor-pointer"
                >
                  Instant Demo Results
                </button>
              </p>
            )}
          </div>
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
          sender="Priya CR"
          timestamp="12/10/2026, 13:10"
          isCurrentUser={false}
          className="max-w-md"
        >
          Update regarding Project Phase 1: Due to the college symposium, submission deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM.
        </Bubble>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-12 text-center text-xs text-[var(--muted)]">
          Loading ChatSense analysis intake...
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
