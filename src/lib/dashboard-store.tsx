"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { z } from "zod";
import { showToast as notifyToast } from "@/components/ui/toaster";

// --- Plan.md Section 7 Typed Zod Schemas ---

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  timestamp: z.string(),
  text: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  datePhrase: z.string().nullable().optional(),
  resolvedDate: z.string().nullable().optional(),
  source_quote: z.string(),
  source_message_ids: z.array(z.string()),
  status: z.enum(["open", "done", "dismissed"]),
  confidence: z.enum(["high", "medium", "low"]),
  isOverdue: z.boolean(),
  isUrgent: z.boolean(), // < 24 hours
  isUncertain: z.boolean(),
  timeLeftText: z.string(),
  wasUpdated: z.boolean().optional(),
  historyNote: z.string().optional(),
});
export type TaskItem = z.infer<typeof TaskItemSchema>;

export const ChangeItemSchema = z.object({
  id: z.string(),
  taskTitle: z.string(),
  oldValue: z.string(),
  newValue: z.string(),
  explanation: z.string(),
  messageSender: z.string(),
  messageTimestamp: z.string(),
  source_message_ids: z.array(z.string()),
  source_quote: z.string(),
});
export type ChangeItem = z.infer<typeof ChangeItemSchema>;

export const InfoItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  source_message_ids: z.array(z.string()),
  source_quote: z.string(),
});
export type InfoItem = z.infer<typeof InfoItemSchema>;

export const BillItemSchema = z.object({
  id: z.string(),
  payee: z.string(),
  amount: z.number().nullable(),
  currency: z.string(),
  duePhrase: z.string().nullable(),
  resolvedDate: z.string().nullable().optional(),
  isPaid: z.boolean(),
  source_message_ids: z.array(z.string()),
  source_quote: z.string(),
});
export type BillItem = z.infer<typeof BillItemSchema>;

export const FraudSignalSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  verdict: z.enum(["High risk", "Suspicious", "No red flags found"]),
  reasons: z.array(z.string()),
  extractedDomains: z.array(
    z.object({
      raw: z.string(),
      realDomain: z.string(),
      isShortener: z.boolean(),
      isLookalike: z.boolean(),
      flags: z.array(z.string()),
    })
  ),
  source_message_ids: z.array(z.string()),
  source_quote: z.string(),
});
export type FraudSignal = z.infer<typeof FraudSignalSchema>;

export interface ActionUndoLog {
  id: string;
  description: string;
  actionType: "complete_task" | "dismiss_task" | "edit_task" | "toggle_bill";
  undo: () => void;
}

export interface AnalysisSessionState {
  hasAnalysis: boolean;
  messages: ChatMessage[];
  tasks: TaskItem[];
  changes: ChangeItem[];
  info: InfoItem[];
  bills: BillItem[];
  fraud: FraudSignal[];
}

const STORAGE_KEY = "chatsense_analysis_session_v2";

import { DEMO_ANALYSIS_STATE } from "./mock-data";

export const MOCK_INITIAL_STATE: AnalysisSessionState = DEMO_ANALYSIS_STATE;

interface DashboardContextType {
  state: AnalysisSessionState;
  selectedMessageId: string | null;
  viewerSheetOpen: boolean;
  openViewerForMessage: (messageId: string) => void;
  closeViewer: () => void;
  setAnalysisState: (newState: AnalysisSessionState) => void;
  clearAllData: () => void;
  loadMockData: () => void;
  toggleTaskDone: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
  editTask: (taskId: string, newTitle: string, newDatePhrase?: string) => void;
  toggleBillPaid: (billId: string) => void;
  undoStack: ActionUndoLog[];
  undoLastAction: () => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisSessionState>(() => {
    if (typeof window === "undefined") return MOCK_INITIAL_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore corrupt data
    }
    return MOCK_INITIAL_STATE;
  });

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [viewerSheetOpen, setViewerSheetOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<ActionUndoLog[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [state]);

  const showToast = useCallback((msg: string | null) => {
    if (!msg) {
      setToastMessage(null);
      return;
    }
    setToastMessage(msg);
    notifyToast.message(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  }, []);

  const openViewerForMessage = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
    setViewerSheetOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerSheetOpen(false);
  }, []);

  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setState({
      hasAnalysis: false,
      messages: [],
      tasks: [],
      changes: [],
      info: [],
      bills: [],
      fraud: []
    });
    setUndoStack([]);
    notifyToast.success("All local workspace data cleared.");
  }, []);

  const loadMockData = useCallback(() => {
    setState(MOCK_INITIAL_STATE);
    notifyToast.success("Loaded demo chat with actions & deadlines!");
  }, []);

  const toggleTaskDone = useCallback((taskId: string) => {
    let prevStatus: "open" | "done" | "dismissed" = "open";
    let nextStatus: "open" | "done" = "done";

    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      if (!target) return prev;
      prevStatus = target.status;
      nextStatus = prevStatus === "done" ? "open" : "done";

      // Push to undo stack
      setUndoStack((u) => [
        {
          id: Math.random().toString(36).substring(7),
          description: `Task marked as ${nextStatus === "done" ? "Done" : "Open"}`,
          actionType: "complete_task",
          undo: () => {
            setState((s) => ({
              ...s,
              tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
            }));
            notifyToast.message("Reversed task completion.");
          }
        },
        ...u
      ]);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      };
    });

    notifyToast.undo("Task status updated.", () => {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
      }));
      notifyToast.success("Reversed task completion.");
    });
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    let prevStatus: "open" | "done" | "dismissed" = "open";
    let taskTitle = "";

    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      if (!target) return prev;
      prevStatus = target.status;
      taskTitle = target.title;

      setUndoStack((u) => [
        {
          id: Math.random().toString(36).substring(7),
          description: `Task "${target.title}" dismissed`,
          actionType: "dismiss_task",
          undo: () => {
            setState((s) => ({
              ...s,
              tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
            }));
            notifyToast.message("Restored dismissed task.");
          }
        },
        ...u
      ]);

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: "dismissed" } : t))
      };
    });

    notifyToast.undo(`Task "${taskTitle}" dismissed.`, () => {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
      }));
      notifyToast.success("Restored dismissed task.");
    });
  }, []);

  const editTask = useCallback((taskId: string, newTitle: string, newDatePhrase?: string) => {
    let prevTitle = "";
    let prevDate: string | null | undefined = "";

    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      if (!target) return prev;
      prevTitle = target.title;
      prevDate = target.datePhrase;

      setUndoStack((u) => [
        {
          id: Math.random().toString(36).substring(7),
          description: `Edited task "${newTitle}"`,
          actionType: "edit_task",
          undo: () => {
            setState((s) => ({
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId ? { ...t, title: prevTitle, datePhrase: prevDate } : t
              )
            }));
            notifyToast.message("Reversed task edit.");
          }
        },
        ...u
      ]);

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                title: newTitle.trim() || t.title,
                datePhrase: newDatePhrase !== undefined ? newDatePhrase.trim() : t.datePhrase,
                wasUpdated: true
              }
            : t
        )
      };
    });

    notifyToast.undo("Task saved.", () => {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, title: prevTitle, datePhrase: prevDate } : t
        )
      }));
      notifyToast.success("Reversed task edit.");
    });
  }, []);

  const toggleBillPaid = useCallback((billId: string) => {
    let prevPaid = false;

    setState((prev) => {
      const target = prev.bills.find((b) => b.id === billId);
      if (!target) return prev;
      prevPaid = target.isPaid;

      setUndoStack((u) => [
        {
          id: Math.random().toString(36).substring(7),
          description: `Bill "${target.payee}" marked ${!prevPaid ? "Paid" : "Unpaid"}`,
          actionType: "toggle_bill",
          undo: () => {
            setState((s) => ({
              ...s,
              bills: s.bills.map((b) => (b.id === billId ? { ...b, isPaid: prevPaid } : b))
            }));
            notifyToast.message("Reversed bill status.");
          }
        },
        ...u
      ]);

      return {
        ...prev,
        bills: prev.bills.map((b) => (b.id === billId ? { ...b, isPaid: !prevPaid } : b))
      };
    });

    notifyToast.undo("Bill status updated.", () => {
      setState((s) => ({
        ...s,
        bills: s.bills.map((b) => (b.id === billId ? { ...b, isPaid: prevPaid } : b))
      }));
      notifyToast.success("Reversed bill status.");
    });
  }, []);

  const undoLastAction = useCallback(() => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    setUndoStack(rest);
    action.undo();
  }, [undoStack]);

  return (
    <DashboardContext.Provider
      value={{
        state,
        selectedMessageId,
        viewerSheetOpen,
        openViewerForMessage,
        closeViewer,
        setAnalysisState: setState,
        clearAllData,
        loadMockData,
        toggleTaskDone,
        dismissTask,
        editTask,
        toggleBillPaid,
        undoStack,
        undoLastAction,
        toastMessage,
        setToastMessage: showToast
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
