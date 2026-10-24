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
  resolvedDate?: string | null;
  timeLeft: TimeLeftMeter;
  sourceMessageId: string;
  sourceSender: string;
  sourceTimestamp: string;
  sourceQuote: string;
  isPaid: boolean;
  isDismissed: boolean;
}

export interface ProcessedInfo {
  id: string;
  label: string;
  value: string;
  source_message_ids: string[];
  source_quote: string;
}

export interface ProcessedFraud {
  id: string;
  messageId: string;
  verdict: "High risk" | "Suspicious" | "No red flags found";
  reasons: string[];
  extractedDomains: Array<{
    raw: string;
    realDomain: string;
    isShortener: boolean;
    isLookalike: boolean;
    flags: string[];
  }>;
  source_message_ids: string[];
  source_quote: string;
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

const SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "adf.ly",
  "bitly.com"
]);

/**
 * Processes extracted messages to build deduplicated tasks, time-left meters,
 * the "What Changed" feed, notices, and fraud signals.
 */
export function processChatItems(
  items: MessageAnalysis[],
  messages: RawChatMessage[],
  referenceDate: Date = new Date()
): {
  tasks: ConsolidatedTask[];
  changeFeed: ChangeEvent[];
  bills: ProcessedBill[];
  info: ProcessedInfo[];
  fraud: ProcessedFraud[];
} {
  const messageMap = new Map<string, RawChatMessage>();
  for (const m of messages) {
    messageMap.set(m.id, m);
  }

  const tasks: ConsolidatedTask[] = [];
  const bills: ProcessedBill[] = [];
  const changeFeed: ChangeEvent[] = [];
  const infoList: ProcessedInfo[] = [];
  const fraudList: ProcessedFraud[] = [];

  let taskCounter = 1;
  let billCounter = 1;
  let changeCounter = 1;
  let infoCounter = 1;
  let fraudCounter = 1;

  // 1. First pass: Register original tasks, bills, info, and fraud
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
        resolvedDate: resolvedDate ? resolvedDate.toISOString() : null,
        timeLeft,
        sourceMessageId: item.message_id,
        sourceSender: rawMsg?.sender || "Sender",
        sourceTimestamp: rawMsg?.timestamp || "",
        sourceQuote: item.source_quote,
        isPaid: false,
        isDismissed: false
      });
    }

    // Info notices
    if (item.category === "info" || item.info) {
      infoList.push({
        id: `i_${String(infoCounter++).padStart(3, "0")}`,
        label: item.info?.label || "Campus Notice",
        value: item.info?.value || item.source_quote,
        source_message_ids: [item.message_id],
        source_quote: item.source_quote
      });
    }

    // Suspicious / Fraud signals
    const textToCheck = (rawMsg?.text || item.source_quote || "").toLowerCase();
    const hasSuspiciousCategory = item.category === "suspicious";
    const hasFraudSignals = item.fraud_signals && item.fraud_signals.length > 0;
    const urlMatches = (rawMsg?.text || item.source_quote || "").match(/https?:\/\/[^\s)\]>"']+/gi) || [];

    if (hasSuspiciousCategory || hasFraudSignals || urlMatches.length > 0) {
      const extractedDomains: ProcessedFraud["extractedDomains"] = [];
      const reasons: string[] = [];
      let isHighRisk = false;

      for (const u of urlMatches) {
        try {
          const parsedUrl = new URL(u);
          const domain = parsedUrl.hostname.toLowerCase();
          const isShort = SHORTENER_DOMAINS.has(domain);
          const isLookalike = domain.includes("sbi") || domain.endsWith(".xyz") || domain.endsWith(".top") || isShort;
          const flags: string[] = [];

          if (isShort) {
            flags.push("URL shortener hides target");
            reasons.push(`Shortened ${domain} link conceals destination`);
          }
          if (isLookalike) {
            flags.push("Potential phishing or untrusted domain");
          }
          if (textToCheck.includes("kyc") || textToCheck.includes("blocked") || textToCheck.includes("terminated")) {
            flags.push("Impersonating bank security alert");
            isHighRisk = true;
          }

          extractedDomains.push({
            raw: u,
            realDomain: domain,
            isShortener: isShort,
            isLookalike,
            flags: flags.length > 0 ? flags : ["External link"]
          });
        } catch {
          // ignore malformed URLs
        }
      }

      if (textToCheck.includes("kyc") || textToCheck.includes("blocked") || textToCheck.includes("deactivated")) {
        reasons.push("Urgent threat of account block or immediate KYC penalty");
        isHighRisk = true;
      }
      if (textToCheck.includes("discount") || textToCheck.includes("download") || textToCheck.includes(".zip")) {
        reasons.push("Unsolicited promotional project code or software download lure");
      }
      if (item.fraud_signals) {
        if (item.fraud_signals.includes("urgency") && !reasons.includes("Artificial urgency pressure")) {
          reasons.push("Artificial urgency pressure");
        }
        if (item.fraud_signals.includes("fake_authority")) {
          reasons.push("Unofficial sender impersonating authority");
        }
      }

      if (reasons.length > 0 || extractedDomains.length > 0) {
        fraudList.push({
          id: `f_${String(fraudCounter++).padStart(3, "0")}`,
          messageId: item.message_id,
          verdict: isHighRisk ? "High risk" : "Suspicious",
          reasons: reasons.slice(0, 3),
          extractedDomains,
          source_message_ids: [item.message_id],
          source_quote: item.source_quote
        });
      }
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
    bills,
    info: infoList,
    fraud: fraudList
  };
}
