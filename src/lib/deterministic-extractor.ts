import { RawChatMessage, MessageAnalysis } from "./types";

const SHORTENER_DOMAINS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly"];

/**
 * Extracts action items, deadlines, bills, notices, and fraud signals
 * using fast regex-based heuristics in <10ms.
 */
export function extractDeterministically(messages: RawChatMessage[]): MessageAnalysis[] {
  const items: MessageAnalysis[] = [];

  for (const m of messages) {
    const text = m.text.trim();
    const lower = text.toLowerCase();

    // 1. Phishing / Scam detection
    const urlMatches = text.match(/https?:\/\/[^\s)\]>"']+/gi) || [];
    const isPhishingLure =
      lower.includes("blocked") ||
      lower.includes("kyc") ||
      lower.includes("netbanking") ||
      lower.includes("deactivated") ||
      lower.includes("terminated") ||
      (lower.includes("discount") && lower.includes(".zip"));

    const hasShortener = urlMatches.some((u) => SHORTENER_DOMAINS.some((d) => u.toLowerCase().includes(d)));
    const hasSuspiciousTld = urlMatches.some((u) => u.toLowerCase().includes(".xyz") || u.toLowerCase().includes(".top"));

    if (isPhishingLure || hasShortener || hasSuspiciousTld) {
      const fraud_signals: Array<"urgency" | "fake_authority" | "kyc_threat" | "prize_lure" | "payment_request"> = [];
      if (lower.includes("urgent") || lower.includes("blocked") || lower.includes("today")) fraud_signals.push("urgency");
      if (lower.includes("sbi") || lower.includes("bank") || lower.includes("customer")) fraud_signals.push("fake_authority");
      if (lower.includes("kyc")) fraud_signals.push("kyc_threat");
      if (lower.includes("discount") || lower.includes("free")) fraud_signals.push("prize_lure");

      items.push({
        message_id: m.id,
        category: "suspicious",
        task: null,
        updates_task_hint: null,
        bill: null,
        info: null,
        fraud_signals,
        source_quote: text,
        confidence: "high"
      });
      continue;
    }

    // 2. Change / What Changed detection
    const changeMatch = text.match(
      /(?:deadline|submission|date|session|lab|venue)\s+(?:is\s+)?(?:moved|postponed|shifted|extended|rescheduled)\s+(?:from\s+(.+?)\s+)?to\s+(.+?)(?:\.|$)/i
    );
    if (changeMatch || (lower.includes("update") && (lower.includes("moved from") || lower.includes("shifted to")))) {
      items.push({
        message_id: m.id,
        category: "change",
        task: null,
        updates_task_hint: text,
        bill: null,
        info: null,
        fraud_signals: [],
        source_quote: text,
        confidence: "high"
      });
      continue;
    }

    // 3. Bill / Dues detection
    const moneyMatch = text.match(/(?:₹|Rs\.?)\s*([0-9,]+)/i);
    const upiMatch = text.match(/(?:to|pay)\s+([a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+)/i);
    if (moneyMatch || (lower.includes("bill") && upiMatch)) {
      const amount = moneyMatch ? parseInt(moneyMatch[1].replace(/,/g, ""), 10) : null;
      const payee = upiMatch ? upiMatch[1].trim() : m.sender;
      const dueMatch = text.match(/by\s+([0-9a-zA-Z ]+?)(?:\.|$)/i);

      items.push({
        message_id: m.id,
        category: "bill",
        task: null,
        updates_task_hint: null,
        bill: {
          payee,
          amount,
          currency: "INR",
          due_phrase: dueMatch ? `by ${dueMatch[1].trim()}` : null
        },
        info: null,
        fraud_signals: [],
        source_quote: text,
        confidence: "high"
      });
      continue;
    }

    // 4. Task / Deadline detection
    const isTaskKeyword =
      lower.includes("due") ||
      lower.includes("deadline") ||
      lower.includes("submission") ||
      lower.includes("submit") ||
      lower.includes("assignment") ||
      lower.includes("form seminar") ||
      lower.includes("form group");

    const isNonActionable =
      lower.includes("paid mine") ||
      lower.includes("extra notes") ||
      lower.includes("went too fast") ||
      lower.includes("haha");

    if (isTaskKeyword && !isNonActionable) {
      let title = "Group Action Item";
      if (lower.includes("project phase 1")) title = "Project Phase 1 submission";
      else if (lower.includes("seminar")) title = "Form seminar groups";
      else if (lower.includes("assignment")) title = "Assignment submission";
      else if (lower.includes("lab")) title = "Lab Submission";
      else {
        const firstSentence = text.split(/[.?!]/)[0];
        title = firstSentence.length > 50 ? `${firstSentence.slice(0, 47)}...` : firstSentence;
      }

      const datePhraseMatch = text.match(
        /(?:due|by|before|on)\s+((?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}(?:st|nd|rd|th)?\s+[a-zA-Z]+)(?:\s+(?:by\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?)/i
      );

      items.push({
        message_id: m.id,
        category: "task",
        task: {
          title,
          date_phrase: datePhraseMatch ? datePhraseMatch[1].trim() : null,
          assignee: null
        },
        updates_task_hint: null,
        bill: null,
        info: null,
        fraud_signals: [],
        source_quote: text,
        confidence: "high"
      });
      continue;
    }

    // 5. Info / Notice detection
    if (lower.startsWith("notice:") || lower.includes("shifted to lab") || lower.includes("include full names")) {
      let label = "Notice";
      if (lower.includes("lab")) label = "Lab Venue Shift";
      else if (lower.includes("names") || lower.includes("roll numbers")) label = "Submission Requirements";

      items.push({
        message_id: m.id,
        category: "info",
        task: null,
        updates_task_hint: null,
        bill: null,
        info: {
          label,
          value: text
        },
        fraud_signals: [],
        source_quote: text,
        confidence: "high"
      });
      continue;
    }

    // 6. Otherwise noise
    items.push({
      message_id: m.id,
      category: "noise",
      task: null,
      updates_task_hint: null,
      bill: null,
      info: null,
      fraud_signals: [],
      source_quote: text,
      confidence: "high"
    });
  }

  return items;
}
