import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No chat analyzed yet",
  description = "Analyze a WhatsApp conversation to extract tasks, changes, and verification signals.",
}: EmptyStateProps) {
  return (
    <Card interactive={false} className="p-12 text-center max-w-lg mx-auto space-y-4 my-8">
      <div className="w-12 h-12 rounded-[14px] bg-[var(--accent-tint)] text-[var(--accent)] mx-auto flex items-center justify-center">
        <Inbox className="w-6 h-6 stroke-[1.5]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">
          {title}
        </h3>
        <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>
      <div className="pt-2">
        <Button asChild size="sm">
          <Link href="/app" className="inline-flex items-center gap-1.5">
            <span>Go to Analyze</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
