"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-10">
      <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-[var(--muted)]">
            Phase A Verification
          </span>
          <h1 className="text-4xl text-[var(--foreground)] mt-1 font-serif-heading">
            Design Tokens & Theme Verification
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Typography Hierarchy */}
      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] font-serif-heading">
          Typography System (Serif Headings, Inter Body, JetBrains Mono)
        </h2>
        <p className="text-[var(--foreground)] text-base leading-relaxed">
          This is the primary body copy set in Inter at 16px with line-height 1.6. It is clear, accessible, and balanced for long reading sessions.
        </p>
        <p className="text-[var(--muted)] text-sm">
          Secondary metadata copy in muted grey tone with crisp legibility.
        </p>
        <div className="p-4 rounded-[12px] bg-[var(--card-bg)] border border-[var(--border-subtle)] font-mono-detail text-sm space-y-1">
          <div>Domain check: <span className="text-[var(--accent)] font-semibold">sbi.co.in</span> (genuine bank gateway)</div>
          <div>Amount quote: <span className="font-semibold">₹450 due on 18th Oct</span></div>
          <div>Raw quote: <span className="text-[var(--muted)]">"Please note submission is moved to Sunday 18th Oct"</span></div>
        </div>
      </section>

      {/* Cards with Hue Effect */}
      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] font-serif-heading">
          Card Hue Effect (5-7% Indigo Tint, 1px Hairline, Soft Shadow, 2px Hover Lift)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="hue-card p-6 cursor-pointer">
            <h3 className="text-xl font-serif-heading text-[var(--foreground)] mb-2">
              Every item shows source
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Tap any card to view the exact original WhatsApp message.
            </p>
          </div>

          <div className="hue-card p-6 cursor-pointer">
            <h3 className="text-xl font-serif-heading text-[var(--foreground)] mb-2">
              Runs on your device
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Your sensitive chat text is never sold or used for training.
            </p>
          </div>

          <div className="hue-card p-6 cursor-pointer">
            <h3 className="text-xl font-serif-heading text-[var(--foreground)] mb-2">
              Links checked by code
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Deterministic security verification before any AI advice.
            </p>
          </div>
        </div>
      </section>

      {/* Verdict Tokens (Never Green, Never "Safe") */}
      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] font-serif-heading">
          Risk & Urgency Badges
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--verdict-high-risk-bg)] text-[var(--verdict-high-risk-text)] border border-[var(--verdict-high-risk-border)]">
            High risk
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--verdict-suspicious-bg)] text-[var(--verdict-suspicious-text)] border border-[var(--verdict-suspicious-border)]">
            Suspicious
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--verdict-neutral-bg)] text-[var(--verdict-neutral-text)] border border-[var(--verdict-neutral-border)]">
            No red flags found
          </span>
        </div>
      </section>

      {/* Button & Radius Tokens */}
      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] font-serif-heading">
          Control Tokens (12px Buttons, 20px Cards, Rounded Pills)
        </h2>
        <div className="flex items-center gap-4">
          <button className="ui-button px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer">
            Primary Action
          </button>
          <button className="ui-button px-5 py-2.5 bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] border border-[var(--border-subtle)] text-[var(--foreground)] text-sm font-medium transition-colors cursor-pointer">
            Secondary Action
          </button>
          <span className="ui-pill px-4 py-1.5 bg-[var(--accent-tint)] text-[var(--accent)] text-xs font-semibold border border-[var(--border-subtle)]">
            Pill Tag
          </span>
        </div>
      </section>
    </div>
  );
}
