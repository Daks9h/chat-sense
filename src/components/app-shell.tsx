"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageViewerSheet } from "@/components/message-viewer-sheet";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { BrandLogo } from "@/components/brand-logo";
import { WarpBackground } from "@/components/magicui/warp-background";
import {
  FileText,
  Calendar,
  CheckSquare,
  History,
  Info,
  CreditCard,
  ShieldAlert,
  Target,
  Settings,
  MessageSquare,
  Menu,
  X,
  Lock,
  RotateCcw,
  Sparkles
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { state, openViewerForMessage, undoStack, undoLastAction, toastMessage } = useDashboard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openTasksCount = state.tasks.filter((t) => t.status === "open").length;
  const fraudCount = state.fraud.filter((f) => f.verdict !== "No red flags found").length;

  const navGroups = [
    {
      group: "Workspace",
      items: [
        { title: "Analyze", href: "/app", icon: FileText, badge: null },
        { title: "Today", href: "/app/today", icon: Calendar, badge: null }
      ]
    },
    {
      group: "Insights",
      items: [
        { title: "To-do", href: "/app/todo", icon: CheckSquare, badge: openTasksCount > 0 ? openTasksCount : null },
        { title: "What changed", href: "/app/changes", icon: History, badge: state.changes.length > 0 ? state.changes.length : null },
        { title: "Info", href: "/app/info", icon: Info, badge: null },
        { title: "Bills", href: "/app/bills", icon: CreditCard, badge: null },
        {
          title: "Fraud check",
          href: "/app/fraud",
          icon: ShieldAlert,
          badge: fraudCount > 0 ? fraudCount : null,
          badgeVariant: "rose"
        }
      ]
    },
    {
      group: "System",
      items: [
        { title: "Accuracy", href: "/app/accuracy", icon: Target, badge: null },
        { title: "Settings", href: "/app/settings", icon: Settings, badge: null }
      ]
    }
  ];

  // Helper to get active header title and subtitle (<= 14 words)
  const getHeaderInfo = () => {
    switch (pathname) {
      case "/app":
        return { title: "Chat Intake", subtitle: "Paste or upload WhatsApp messages. Your chat stays on this device." };
      case "/app/today":
        return { title: "Today Digest", subtitle: "Immediate deadlines, overdue actions, and suspicious alerts at a glance." };
      case "/app/todo":
        return { title: "Action Items", subtitle: "Prioritized tasks sorted by urgency with verifiable source quotes." };
      case "/app/changes":
        return { title: "What Changed", subtitle: "Chronological corrections feed where the latest message always wins." };
      case "/app/info":
        return { title: "Notices & Info", subtitle: "Structured factual updates, room changes, and key contacts." };
      case "/app/bills":
        return { title: "Bills & Payments", subtitle: "Tracked payment dues, payee UPIs, and monthly running total." };
      case "/app/fraud":
        return { title: "Fraud & Safety", subtitle: "Deterministic code checks for shorteners, lookalikes, and payment traps." };
      case "/app/accuracy":
        return { title: "Extraction Accuracy", subtitle: "Hand-verified benchmark results across test chats with trap messages." };
      case "/app/settings":
        return { title: "Settings", subtitle: "Local storage controls, calendar export, and active AI model." };
      default:
        return { title: "Dashboard", subtitle: "Evidence-backed chat intelligence." };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border-subtle)] bg-[var(--card-bg)]/40 p-4 shrink-0 justify-between sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center px-2 py-1.5 group">
            <BrandLogo size={32} textClassName="text-base" />
          </Link>

          {/* Navigation Groups */}
          <div className="space-y-5">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <span className="px-2.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-[var(--muted)]">
                  {grp.group}
                </span>
                <nav className="space-y-0.5 pt-1">
                  {grp.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-all duration-150 select-none ${
                          isActive
                            ? "bg-[var(--accent)] text-white shadow-xs"
                            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? "text-white" : ""}`} />
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== null && (
                          <Badge
                            variant={item.badgeVariant === "rose" ? "urgent" : "secondary"}
                            className={`text-[10px] py-0 px-1.5 h-4.5 ${
                              isActive ? "bg-white/20 text-white border-transparent" : ""
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Local only</span>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* --- Mobile Header & Menu --- */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--card-bg)] sticky top-0 z-40">
        <Link href="/" className="flex items-center">
          <BrandLogo size={28} textClassName="text-sm font-bold" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-[12px] border border-[var(--border-subtle)] text-[var(--foreground)]"
            aria-label="Toggle mobile menu"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <DrawerContent side="left" className="w-72 p-5 flex flex-col justify-between">
          <DrawerHeader className="p-0 pb-3 border-b border-[var(--border-subtle)] flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <BrandLogo size={26} textClassName="text-sm font-bold" />
              <DrawerTitle className="sr-only">ChatSense</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button className="p-1 rounded-[8px] hover:bg-[var(--card-bg-hover)] text-[var(--muted)]">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-[var(--muted)]">
                  {grp.group}
                </span>
                <nav className="space-y-1 pt-1">
                  {grp.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold ${
                          isActive
                            ? "bg-[var(--accent)] text-white shadow-xs"
                            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== null && (
                          <Badge
                            variant={item.badgeVariant === "rose" ? "urgent" : "secondary"}
                            className={`text-[10px] py-0 px-1.5 h-4.5 ${
                              isActive ? "bg-white/20 text-white border-transparent" : ""
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted)] font-mono">ChatSense Local</span>
            <ThemeToggle />
          </div>
        </DrawerContent>
      </Drawer>

      {/* --- Main Workspace Column (Dashboard Area Only) --- */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="border-b border-[var(--border-subtle)] bg-[var(--background)]/80 backdrop-blur-xs sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-[var(--foreground)] leading-tight">
              {title}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5 max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Source Messages Sheet trigger */}
            <button
              onClick={() => openViewerForMessage(state.messages[0]?.id || "")}
              className="ui-button px-3 py-1.5 text-xs font-semibold bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--accent)] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Source messages</span>
              <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1.5">
                {state.messages.length}
              </Badge>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content with Magic UI Warp Background (dashboard only, not sidebar) */}
        <WarpBackground
          className="flex-1 border-0 rounded-none p-6 md:p-8 w-full bg-transparent flex flex-col"
          gridColor="var(--border-subtle)"
          perspective={140}
          beamDuration={4.5}
        >
          <main className="flex-1 max-w-[1100px] w-full mx-auto">
            {children}
          </main>
        </WarpBackground>
      </div>

      {/* Ground Truth Message Viewer Sheet */}
      <MessageViewerSheet />
    </div>
  );
}
