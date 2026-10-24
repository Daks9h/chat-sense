"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`w-9 h-9 rounded-[12px] border border-transparent flex items-center justify-center opacity-70 ${className || ""}`}
        disabled
      >
        <div className="w-4 h-4 rounded-full bg-current opacity-20" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={`relative w-9 h-9 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer ${className || ""}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 stroke-[1.75] transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 stroke-[1.75] transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
}
