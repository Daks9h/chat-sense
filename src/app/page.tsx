"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { BrandLogo } from "@/components/brand-logo";
import { DiaTextReveal } from "@/components/magicui/dia-text-reveal";
import {
  FileSearch,
  ShieldCheck,
  Code2,
  ArrowRight,
  Menu,
  X,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[#4F46E5]/15 selection:text-[#4F46E5] relative">
      {/* 1. Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-xs py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          <Link href="/" className="group flex items-center">
            <BrandLogo size={34} textClassName="text-lg" />
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--muted)]">
            <a
              href="#how-it-works"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              How it works
            </a>
            <a
              href="#privacy"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Privacy
            </a>
            <Link
              href="/app"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Accuracy
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3.5">
            <ThemeToggle />
            <Link
              href="/app"
              className="ui-button px-4.5 py-2 text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[12px] border border-[var(--border-subtle)] text-[var(--foreground)] bg-[var(--card-bg)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DrawerContent side="left" className="w-72 p-6 flex flex-col justify-between">
            <DrawerHeader className="p-0 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <BrandLogo size={28} textClassName="text-base" />
                <DrawerTitle className="sr-only">ChatSense</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <button
                  className="p-1.5 rounded-[8px] hover:bg-[var(--card-bg-hover)] text-[var(--muted)]"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </DrawerClose>
            </DrawerHeader>

            <nav className="flex flex-col space-y-3 py-6 text-sm font-medium text-[var(--foreground)] flex-1">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[var(--accent)] transition-colors"
              >
                How it works
              </a>
              <a
                href="#privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[var(--accent)] transition-colors"
              >
                Privacy
              </a>
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[var(--accent)] transition-colors"
              >
                Accuracy
              </Link>
            </nav>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href="/app"
                className="ui-button w-full py-2.5 text-center text-xs font-semibold bg-[var(--accent)] text-white block shadow-xs"
              >
                Get started
              </Link>
            </div>
          </DrawerContent>
        </Drawer>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-start pt-32 md:pt-40 pb-20 overflow-hidden">
        {/* Hero Background Layer (Light & Dark WebP, zero flash via CSS classes) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <Image
            src="/hero-light.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom dark:hidden"
          />
          <Image
            src="/hero-dark.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom hidden dark:block"
          />
        </div>

        {/* Bottom 20% smooth fade into exact sampled page background */}
        <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-1" />

        {/* Hero Content Layer (Upper two-thirds, no collision with shapes) */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center space-y-6 animate-fade-up">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.08]">
            <DiaTextReveal
              text="Chats --> Actions"
              colors={["#6366F1", "#A855F7", "#EC4899", "#F59E0B", "#4F46E5"]}
              duration={1.8}
            />
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/app"
              className="ui-button px-6 py-3 text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/app?demo=true"
              className="ui-button px-5 py-3 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] hover:bg-[var(--accent-tint)] transition-colors"
            >
              See a demo &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Trust Section */}
      <section id="trust" className="py-24 md:py-32 relative z-10 max-w-6xl mx-auto px-6 md:px-8 space-y-14">
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
              Clear actions, not clutter.
            </h2>
            {/* Thin wavy indigo underline SVG */}
            <svg
              className="w-full h-3 mt-1.5 text-[var(--accent)]"
              viewBox="0 0 280 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M2 7C40 2 80 11 120 6C160 1 200 11 240 6C260 3.5 275 8 278 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-sm md:text-base text-[var(--muted)] max-w-lg mx-auto">
            Cut through disorganized group chats with verifiable evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="hue-card p-7 space-y-3 cursor-pointer">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center">
              <FileSearch className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Every item shows its source
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Tap any card to see the exact message.
            </p>
          </div>

          <div className="hue-card p-7 space-y-3 cursor-pointer">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Runs on your device
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Your chat is analyzed locally.
            </p>
          </div>

          <div className="hue-card p-7 space-y-3 cursor-pointer">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center">
              <Code2 className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Links checked by code
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Verdicts come from checks, not guesses.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 relative z-10 border-t border-[var(--border-subtle)] max-w-6xl mx-auto px-6 md:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
            Simple Workflow
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="hue-card p-7 space-y-3 relative">
            <span className="text-3xl font-mono font-extrabold text-[var(--accent)]/40">
              01
            </span>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Paste a chat
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Upload exported WhatsApp text or paste raw conversation lines.
            </p>
          </div>

          <div className="hue-card p-7 space-y-3 relative">
            <span className="text-3xl font-mono font-extrabold text-[var(--accent)]/40">
              02
            </span>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Get clear actions
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Deadlines, bills, and changes sorted automatically.
            </p>
          </div>

          <div className="hue-card p-7 space-y-3 relative">
            <span className="text-3xl font-mono font-extrabold text-[var(--accent)]/40">
              03
            </span>
            <h3 className="text-lg font-heading font-bold text-[var(--foreground)]">
              Check anything suspicious
            </h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Deterministic code flags lookalike domains, payment traps, and urgency lures.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Privacy Statement Section */}
      <section id="privacy" className="py-20 relative z-10 border-t border-[var(--border-subtle)] max-w-4xl mx-auto px-6 md:px-8 text-center space-y-4">
        <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Privacy First Architecture
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
          ChatSense stores parsed tasks directly in your browser&apos;s local storage. Your chats are never sold, indexed, or used to train third-party machine learning models.
        </p>
      </section>

      {/* 6. Final Call to Action */}
      <section className="py-24 md:py-32 relative z-10 border-t border-[var(--border-subtle)] max-w-4xl mx-auto px-6 md:px-8 text-center space-y-6">
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
          Stop searching through hundreds of messy group messages.
        </h2>
        <div className="pt-2">
          <Link
            href="/app"
            className="ui-button inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-colors"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 relative z-10 bg-[var(--background)]/80">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <BrandLogo size={22} textClassName="text-xs font-semibold" />
            <span className="text-[var(--muted)]">• Evidence-backed chat intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-[var(--foreground)] transition-colors">
              How it works
            </a>
            <a href="#privacy" className="hover:text-[var(--foreground)] transition-colors">
              Privacy
            </a>
            <Link href="/app" className="hover:text-[var(--foreground)] transition-colors">
              Accuracy
            </Link>
            <Link href="/app" className="hover:text-[var(--foreground)] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating "Try demo chat" button at bottom-right */}
      <aside aria-label="Quick Demo Action" className="fixed bottom-6 right-6 z-40 animate-fade-up">
        <Link
          href="/app?demo=true"
          className="ui-pill px-4.5 py-2.5 bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--foreground)] hover:text-[var(--accent)] border border-[var(--border-subtle)] hover:border-[var(--accent)] shadow-md flex items-center gap-2 text-xs font-semibold transition-all duration-150 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span>Try demo chat</span>
        </Link>
      </aside>
    </div>
  );
}
