"use client";

import React, { useState } from "react";
import { useDashboard, FraudSignal } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/empty-state";
import { ShieldAlert, AlertTriangle, ShieldCheck, ExternalLink, Lock, MessageSquare } from "lucide-react";

export default function FraudPage() {
  const { state, openViewerForMessage } = useDashboard();
  const [confirmedOpenLink, setConfirmedOpenLink] = useState<string | null>(null);
  const [pendingConfirmUrl, setPendingConfirmUrl] = useState<string | null>(null);

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  const handleOpenLink = (url: string) => {
    // Only allow http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    setPendingConfirmUrl(url);
  };

  const confirmAndProceed = () => {
    if (pendingConfirmUrl) {
      window.open(pendingConfirmUrl, "_blank", "noopener,noreferrer");
      setConfirmedOpenLink(pendingConfirmUrl);
      setPendingConfirmUrl(null);
    }
  };

  const getVerdictBadge = (verdict: FraudSignal["verdict"]) => {
    switch (verdict) {
      case "High risk":
        return <Badge variant="high-risk">High risk</Badge>;
      case "Suspicious":
        return <Badge variant="suspicious">Suspicious</Badge>;
      default:
        return <Badge variant="neutral">No red flags found</Badge>;
    }
  };

  const highRiskCount = state.fraud.filter((f) => f.verdict === "High risk").length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Security Advisory Alert */}
      {state.fraud.length > 0 ? (
        <Alert variant={highRiskCount > 0 ? "destructive" : "warning"}>
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle>
              {highRiskCount > 0
                ? `${highRiskCount} High-Risk Scam / Phishing Lures Detected`
                : "Suspicious Messages Require Review"}
            </AlertTitle>
            <AlertDescription>
              Never share UPI PINs, OTPs, or login credentials. Verify urgent banking notices directly with official bank customer support.
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <Alert variant="neutral">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle>No Active Threat Vectors</AlertTitle>
            <AlertDescription>
              Deterministic code found no shortened banking links, lookalike domains, or UPI payment lure traps.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <span className="text-xs font-mono text-[var(--muted)]">
          Deterministic URL, shortener, and UPI PIN lure analysis
        </span>
        <span className="text-xs font-mono text-[var(--muted)]">
          {state.fraud.length} {state.fraud.length === 1 ? "flagged message" : "flagged messages"}
        </span>
      </div>

      {state.fraud.length === 0 ? (
        <Card interactive={false} className="p-8 text-center text-xs text-[var(--muted)]">
          No red flags found in this chat.
        </Card>
      ) : (
        <div className="space-y-5">
          {state.fraud.map((item) => (
            <Card
              key={item.id}
              className={`p-6 space-y-4 ${
                item.verdict === "High risk"
                  ? "border-rose-500/30"
                  : item.verdict === "Suspicious"
                  ? "border-amber-500/30"
                  : ""
              }`}
            >
              {/* Verdict Heading & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {item.verdict === "High risk" ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  ) : item.verdict === "Suspicious" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-[var(--muted)]" />
                  )}
                  <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">
                    {item.verdict}
                  </h3>
                </div>
                {getVerdictBadge(item.verdict)}
              </div>

              {/* Up to 3 Reasons */}
              <div className="space-y-1.5 pl-1">
                <p className="text-[11px] font-mono text-[var(--muted)] uppercase font-semibold">
                  Detected Red Flags:
                </p>
                <ul className="space-y-1 text-xs text-[var(--foreground)] list-disc list-inside">
                  {item.reasons.slice(0, 3).map((reason, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extracted Domains with Flags */}
              {item.extractedDomains.length > 0 && (
                <div className="p-3.5 rounded-[12px] bg-[var(--background)]/80 border border-[var(--border-subtle)] space-y-3">
                  <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-semibold">
                    Extracted Domains (Isolated):
                  </span>
                  {item.extractedDomains.map((dom, dIdx) => (
                    <div key={dIdx} className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-[var(--foreground)]">{dom.realDomain}</span>
                          {dom.isShortener && (
                            <Badge variant="suspicious" className="text-[10px] py-0 px-1.5">
                              Shortener
                            </Badge>
                          )}
                          {dom.isLookalike && (
                            <Badge variant="high-risk" className="text-[10px] py-0 px-1.5">
                              Lookalike
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[var(--muted)] truncate max-w-sm">
                          {dom.raw}
                        </p>
                      </div>

                      {/* Disabled "Open anyway" button requiring confirmation */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLink(dom.raw)}
                        className="text-[11px] h-7 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Open anyway</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Source Quote */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <p className="font-mono text-[10px] text-[var(--muted)] truncate max-w-lg">
                  &ldquo;{item.source_quote}&rdquo;
                </p>

                <button
                  onClick={() => openViewerForMessage(item.source_message_ids[0])}
                  className="text-[var(--accent)] hover:underline font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Inspect message</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mandatory Safety Disclaimer Footer */}
      <footer className="pt-4 text-center">
        <p className="text-xs font-mono text-[var(--muted)] italic">
          No check can guarantee a message is genuine.
        </p>
      </footer>

      {/* Confirmation Dialog for opening suspicious links */}
      <AlertDialog
        open={!!pendingConfirmUrl}
        onOpenChange={(open) => !open && setPendingConfirmUrl(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <AlertDialogTitle>Confirm External Navigation</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This link was flagged with risk indicators (e.g. shortened or lookalike destination). Visiting it may expose you to credential phishing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingConfirmUrl && (
            <div className="p-2.5 rounded-[12px] bg-[var(--background)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--muted)] truncate">
              {pendingConfirmUrl}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmAndProceed}
              className="flex items-center gap-1.5"
            >
              <span>Proceed anyway</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
