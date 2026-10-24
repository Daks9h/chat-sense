"use client";

import React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--card-bg)",
          color: "var(--foreground)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          boxShadow: "var(--card-shadow)",
          fontSize: "12px",
          fontFamily: "var(--font-sans)",
        },
        actionButtonStyle: {
          background: "var(--accent)",
          color: "#ffffff",
          borderRadius: "10px",
          fontSize: "11px",
          fontWeight: 600,
          padding: "6px 12px",
        },
      }}
    />
  );
}

export const showToast = {
  message: (msg: string) => sonnerToast(msg),
  success: (msg: string) => sonnerToast.success(msg),
  error: (msg: string) => sonnerToast.error(msg),
  undo: (msg: string, onUndo: () => void) =>
    sonnerToast(msg, {
      action: {
        label: "Undo",
        onClick: onUndo,
      },
      duration: 4500,
    }),
};
