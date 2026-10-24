import { MessageAnalysis, RawChatMessage } from "./types";
import {
  parseMessageTimestamp,
  resolveDatePhrase,
  computeTimeLeft,
  TimeLeftMeter
} from "./date-resolver";

export interface ChangeEvent {
  id: string;
  targetTaskId: string;
  taskTitle: string;
  field: "deadline" | "venue" | "details";
  oldValue: string;
  newValue: string;
  oldDate?: string | null;
  newDate?: string | null;
  messageId: string;
  messageSender: string;
  messageTimestamp: string;
  explanation: string;
  sourceQuote: string;
}

export interface ConsolidatedTask {
  id: string;
  title: string;
  datePhrase: string | null;
  resolvedDate: string | null; // ISO string
  isUncertain: boolean;
  timeLeft: TimeLeftMeter;
  assignee: string | null;
  sourceMessageId: string;
  sourceSender: string;
  sourceTimestamp: string;
  sourceQuote: string;
  confidence: "high" | "medium" | "low";
  wasUpdated: boolean;
  changeHistory: ChangeEvent[];
  isCompleted: boolean;
  isDismissed: boolean;
}

export interface ProcessedBill {
  id: string;
  payee: string;
  amount: number | null;
  currency: "INR";
  duePhrase: string | null;
  resolvedDueDate: string | null;
  timeLeft: TimeLeftMeter;
  sourceMessageId: string;
  sourceSender: string;
  sourceTimestamp: string;
  sourceQuote: string;
  isPaid: boolean;
  isDismissed: boolean;
}

/**
 * Calculates string similarity / keyword overlap to pair change hints with tasks.
 */
function isTaskMatch(taskTitle: string, hintOrText: string): boolean {
  const normTitle = taskTitle.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const normHint = hintOrText.toLowerCase().replace(/[^a-z0-9 ]/g, "");

  if (normHint.includes(normTitle) || normTitle.includes(normHint)) return true;

  const titleWords = normTitle.split(/\s+/).filter((w) => w.length > 3);
  let matches = 0;
  for (const word of titleWords) {
    if (normHint.includes(word)) matches++;
  }

  return titleWords.length > 0 && matches / titleWords.length >= 0.5;
}

/**
 * Processes extracted messages to build deduplicated tasks, time-left meters,
 * and the "What Changed" feed (latest message wins).
 */
export function processChatItems(
  items: MessageAnalysis[],
  messages: RawChatMessage[],
  referenceDate: Date = new Date()
): {
  tasks: ConsolidatedTask[];
  changeFeed: ChangeEvent[];
  bills: ProcessedBill[];
} {
  const messageMap = new Map<string, RawChatMessage>();
  for (const m of messages) {
    messageMap.set(m.id, m);
  }

  const tasks: ConsolidatedTask[] = [];
  const bills: ProcessedBill[] = [];
  const changeFeed: ChangeEvent[] = [];

  let taskCounter = 1;
  let billCounter = 1;
  let changeCounter = 1;

  // 1. First pass: Register original tasks and bills
  for (const item of items) {
    const rawMsg = messageMap.get(item.message_id);
    const msgDate = rawMsg ? parseMessageTimestamp(rawMsg.timestamp) : referenceDate;

    if (item.category === "task" || (item.task && item.category !== "change")) {
      const taskData = item.task || { title: "Untitled Action", date_phrase: null, assignee: null };
      const { resolvedDate, isUncertain } = resolveDatePhrase(taskData.date_phrase, msgDate);
      const timeLeft = computeTimeLeft(resolvedDate, referenceDate);

      tasks.push({
        id: `t_${String(taskCounter++).padStart(3, "0")}`,
        title: taskData.title,
        datePhrase: taskData.date_phrase || null,
        resolvedDate: resolvedDate ? resolvedDate.toISOString() : null,
        isUncertain,
        timeLeft,
        assignee: taskData.assignee || null,
        sourceMessageId: item.message_id,
        sourceSender: rawMsg?.sender || "Sender",
        sourceTimestamp: rawMsg?.timestamp || "",
        sourceQuote: item.source_quote,
        confidence: item.confidence,
        wasUpdated: false,
        changeHistory: [],
        isCompleted: false,
        isDismissed: false
      });
    }

    if (item.bill) {
      const { resolvedDate } = resolveDatePhrase(item.bill.due_phrase, msgDate);
      const timeLeft = computeTimeLeft(resolvedDate, referenceDate);

      bills.push({
        id: `b_${String(billCounter++).padStart(3, "0")}`,
        payee: item.bill.payee,
        amount: item.bill.amount !== undefined ? item.bill.amount : null,
        currency: "INR",
        duePhrase: item.bill.due_phrase || null,
        resolvedDueDate: resolvedDate ? resolvedDate.toISOString() : null,
        timeLeft,
        sourceMessageId: item.message_id,
        sourceSender: rawMsg?.sender || "Sender",
        sourceTimestamp: rawMsg?.timestamp || "",
        sourceQuote: item.source_quote,
        isPaid: false,
        isDismissed: false
      });
    }
  }

  // 2. Second pass: Apply changes (What Changed - latest message wins)
  for (const item of items) {
    if (item.category === "change" || item.updates_task_hint) {
      const rawMsg = messageMap.get(item.message_id);
      const msgDate = rawMsg ? parseMessageTimestamp(rawMsg.timestamp) : referenceDate;
      const hint = item.updates_task_hint || item.source_quote;

      // Find matching target task
      const targetTask = tasks.find((t) => isTaskMatch(t.title, hint));

      if (targetTask) {
        // Resolve new date phrase if the change specifies a new date
        const newDateResult = resolveDatePhrase(hint, msgDate);
        const oldDateVal = targetTask.datePhrase || "Not specified";
        const newDateVal = newDateResult.resolvedDate
          ? newDateResult.resolvedDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })
          : hint;

        const changeEvent: ChangeEvent = {
          id: `c_${String(changeCounter++).padStart(3, "0")}`,
          targetTaskId: targetTask.id,
          taskTitle: targetTask.title,
          field: "deadline",
          oldValue: oldDateVal,
          newValue: newDateVal,
          oldDate: targetTask.resolvedDate,
          newDate: newDateResult.resolvedDate ? newDateResult.resolvedDate.toISOString() : null,
          messageId: item.message_id,
          messageSender: rawMsg?.sender || "Sender",
          messageTimestamp: rawMsg?.timestamp || "",
          explanation: hint,
          sourceQuote: item.source_quote
        };

        // Apply change (Latest message wins)
        targetTask.wasUpdated = true;
        targetTask.changeHistory.push(changeEvent);
        if (newDateResult.resolvedDate) {
          targetTask.resolvedDate = newDateResult.resolvedDate.toISOString();
          targetTask.datePhrase = newDateVal;
          targetTask.isUncertain = false;
          targetTask.timeLeft = computeTimeLeft(newDateResult.resolvedDate, referenceDate);
        }

        changeFeed.push(changeEvent);
      } else {
        // If no prior task matched, record standalone change event
        changeFeed.push({
          id: `c_${String(changeCounter++).padStart(3, "0")}`,
          targetTaskId: "standalone",
          taskTitle: "Notice / General Update",
          field: "details",
          oldValue: "Original schedule",
          newValue: hint,
          messageId: item.message_id,
          messageSender: rawMsg?.sender || "Sender",
          messageTimestamp: rawMsg?.timestamp || "",
          explanation: hint,
          sourceQuote: item.source_quote
        });
      }
    }
  }

  return {
    tasks,
    changeFeed,
    bills
  };
}
