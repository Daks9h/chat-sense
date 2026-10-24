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

// --- Realistic 50-Message College Chat Mock Dataset ---
export const MOCK_50_MESSAGES: ChatMessage[] = [
  { id: "m_001", timestamp: "12/10/2026, 08:30", sender: "CR Sneha", text: "Good morning batch! Please note college symposium starts next week." },
  { id: "m_002", timestamp: "12/10/2026, 08:45", sender: "Prof. Sharma", text: "DBMS Lab Assignment 4 is published. Deadline is Thursday 15th Oct by 5:00 PM on Moodle." },
  { id: "m_003", timestamp: "12/10/2026, 08:50", sender: "Aarav", text: "Sir, do we need to attach schema diagrams in the PDF?" },
  { id: "m_004", timestamp: "12/10/2026, 08:52", sender: "Prof. Sharma", text: "Yes, include ER diagram and normalization steps up to 3NF." },
  { id: "m_005", timestamp: "12/10/2026, 09:10", sender: "Rohan", text: "Anyone knows if attendance is mandatory for today's extra lecture?" },
  { id: "m_006", timestamp: "12/10/2026, 09:15", sender: "CR Sneha", text: "Yes 75% rule strictly applies per Dean circular." },
  { id: "m_007", timestamp: "12/10/2026, 10:00", sender: "Lab Assistant", text: "Notice: Machine Learning Lab session today shifted to Block B Room 402." },
  { id: "m_008", timestamp: "12/10/2026, 10:30", sender: "Hostel Rep Amit", text: "Room 304 electricity meter bill has arrived. Pay ₹520 to hostel@okhdfcbank by 18th Oct." },
  { id: "m_009", timestamp: "12/10/2026, 10:35", sender: "Vikram", text: "Already paid my share Amit!" },
  { id: "m_010", timestamp: "12/10/2026, 11:00", sender: "+91 99882 11223", text: "ALERT: Your SBI YONO account will be deactivated within 12 hours. Update KYC at http://bit.ly/sbi-verify-kyc-alert immediately." },
  { id: "m_011", timestamp: "12/10/2026, 11:05", sender: "CR Sneha", text: "Attention: That random number above is sending phishing links. Do not open!" },
  { id: "m_012", timestamp: "12/10/2026, 11:40", sender: "Priya", text: "We need to finalize our seminar group topics sometime soon before midterms." },
  { id: "m_013", timestamp: "12/10/2026, 12:15", sender: "Prof. Sharma", text: "Urgent Update: Due to campus placement drive, DBMS Assignment 4 deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM." },
  { id: "m_014", timestamp: "12/10/2026, 12:20", sender: "Aarav", text: "Thank you sir for the extension!" },
  { id: "m_015", timestamp: "12/10/2026, 13:00", sender: "Mess Committee", text: "Mess maintenance recharge for October is ₹450 each. Pay to mess@okaxis by Friday 16th Oct." },
  { id: "m_016", timestamp: "12/10/2026, 14:00", sender: "Rohan", text: "Did anyone get the syllabus for cloud computing exam?" },
  { id: "m_017", timestamp: "12/10/2026, 14:15", sender: "CR Sneha", text: "Units 1, 2, and 4 only. Distributed consensus is excluded." },
  { id: "m_018", timestamp: "12/10/2026, 15:00", sender: "Campus Deals", text: "Exclusive student discount: Domino's pizza 40% off code CAMPUSDOMINOS on official app." },
  { id: "m_019", timestamp: "12/10/2026, 16:30", sender: "HOD Office", text: "Official: Library books due date extended to end of the month without fine." },
  { id: "m_020", timestamp: "12/10/2026, 18:00", sender: "Aarav", text: "Submitting assignment draft to Moodle now to avoid last minute server crashes." }
];

export const MOCK_INITIAL_STATE: AnalysisSessionState = {
  hasAnalysis: true,
  messages: MOCK_50_MESSAGES,
  tasks: [
    {
      id: "t_001",
      title: "DBMS Lab Assignment 4",
      datePhrase: "Sunday 18th Oct 11:59 PM",
      resolvedDate: "2026-10-18T18:29:00.000Z",
      source_quote: "DBMS Assignment 4 deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM.",
      source_message_ids: ["m_002", "m_013"],
      status: "open",
      confidence: "high",
      isOverdue: false,
      isUrgent: false,
      isUncertain: false,
      timeLeftText: "6 days left",
      wasUpdated: true,
      historyNote: "Moved from 15th Oct to 18th Oct due to placement drive."
    },
    {
      id: "t_002",
      title: "Finalize seminar group topics",
      datePhrase: "sometime soon before midterms",
      resolvedDate: null,
      source_quote: "We need to finalize our seminar group topics sometime soon before midterms.",
      source_message_ids: ["m_012"],
      status: "open",
      confidence: "medium",
      isOverdue: false,
      isUrgent: false,
      isUncertain: true,
      timeLeftText: "Date unclear",
      wasUpdated: false
    },
    {
      id: "t_003",
      title: "Attach schema & ER diagrams up to 3NF",
      datePhrase: "Thursday 15th Oct",
      resolvedDate: "2026-10-15T11:30:00.000Z",
      source_quote: "include ER diagram and normalization steps up to 3NF.",
      source_message_ids: ["m_004"],
      status: "open",
      confidence: "high",
      isOverdue: false,
      isUrgent: false,
      isUncertain: false,
      timeLeftText: "3 days left",
      wasUpdated: false
    }
  ],
  changes: [
    {
      id: "c_001",
      taskTitle: "DBMS Lab Assignment 4",
      oldValue: "Thursday 15th Oct 5:00 PM",
      newValue: "Sunday 18th Oct 11:59 PM",
      explanation: "Prof. Sharma moved the deadline due to campus placement drive (Latest message wins).",
      messageSender: "Prof. Sharma",
      messageTimestamp: "12/10/2026, 12:15",
      source_message_ids: ["m_013"],
      source_quote: "DBMS Assignment 4 deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM."
    },
    {
      id: "c_002",
      taskTitle: "Machine Learning Lab Venue",
      oldValue: "Standard Lab Block A",
      newValue: "Block B Room 402",
      explanation: "Shifted session venue notified by Lab Assistant.",
      messageSender: "Lab Assistant",
      messageTimestamp: "12/10/2026, 10:00",
      source_message_ids: ["m_007"],
      source_quote: "Notice: Machine Learning Lab session today shifted to Block B Room 402."
    }
  ],
  info: [
    {
      id: "i_001",
      label: "Cloud Computing Syllabus",
      value: "Units 1, 2, and 4 only. Distributed consensus excluded.",
      source_message_ids: ["m_017"],
      source_quote: "Units 1, 2, and 4 only. Distributed consensus is excluded."
    },
    {
      id: "i_002",
      label: "Attendance Rule",
      value: "75% minimum attendance required per Dean circular.",
      source_message_ids: ["m_006"],
      source_quote: "Yes 75% rule strictly applies per Dean circular."
    },
    {
      id: "i_003",
      label: "Library Book Return",
      value: "Extended to end of the month without fine.",
      source_message_ids: ["m_019"],
      source_quote: "Official: Library books due date extended to end of the month without fine."
    }
  ],
  bills: [
    {
      id: "b_001",
      payee: "hostel@okhdfcbank",
      amount: 520,
      currency: "INR",
      duePhrase: "18th Oct",
      resolvedDate: "2026-10-18T18:29:00.000Z",
      isPaid: false,
      source_message_ids: ["m_008"],
      source_quote: "Room 304 electricity meter bill has arrived. Pay ₹520 to hostel@okhdfcbank by 18th Oct."
    },
    {
      id: "b_002",
      payee: "mess@okaxis",
      amount: 450,
      currency: "INR",
      duePhrase: "Friday 16th Oct",
      resolvedDate: "2026-10-16T18:29:00.000Z",
      isPaid: false,
      source_message_ids: ["m_015"],
      source_quote: "Mess maintenance recharge for October is ₹450 each. Pay to mess@okaxis by Friday 16th Oct."
    }
  ],
  fraud: [
    {
      id: "f_001",
      messageId: "m_010",
      verdict: "High risk",
      reasons: [
        "Shortened bit.ly URL hides final destination",
        "Artificial 12-hour account deactivation urgency lure",
        "Unofficial mobile number impersonating State Bank of India"
      ],
      extractedDomains: [
        {
          raw: "http://bit.ly/sbi-verify-kyc-alert",
          realDomain: "bit.ly",
          isShortener: true,
          isLookalike: true,
          flags: ["URL shortener hides target", "Potential bank credential phishing"]
        }
      ],
      source_message_ids: ["m_010"],
      source_quote: "ALERT: Your SBI YONO account will be deactivated within 12 hours. Update KYC at http://bit.ly/sbi-verify-kyc-alert immediately."
    }
  ]
};

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
    notifyToast.success("Loaded 50-message college demo dataset.");
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
