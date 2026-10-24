import { ConsolidatedTask, ProcessedBill, ChangeEvent } from "./change-tracker";

export interface UserActionLog {
  id: string;
  timestamp: string;
  actionType: "dismiss_task" | "edit_task" | "complete_task" | "toggle_bill" | "accept_task";
  targetId: string;
  description: string;
  previousState: unknown;
}

export interface AppWorkspaceState {
  tasks: ConsolidatedTask[];
  bills: ProcessedBill[];
  changeFeed: ChangeEvent[];
  undoStack: UserActionLog[];
}

const STORAGE_KEY = "chatsense_workspace_state_v1";

export function loadWorkspaceFromStorage(): AppWorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load workspace from localStorage:", err);
    return null;
  }
}

export function saveWorkspaceToStorage(state: AppWorkspaceState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save workspace to localStorage:", err);
  }
}

export function clearWorkspaceStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear localStorage:", err);
  }
}

/**
 * Creates an initial action log entry.
 */
export function createActionLog(
  actionType: UserActionLog["actionType"],
  targetId: string,
  description: string,
  previousState: unknown
): UserActionLog {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    actionType,
    targetId,
    description,
    previousState
  };
}
