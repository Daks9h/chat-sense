/**
 * Deterministic Date Resolver (plan.md Section 6, Rule 6 & Section 0, Rule 5)
 *
 * CRITICAL RULE: Dates are resolved using the message's OWN timestamp,
 * NOT the system's current time. A message sent last week saying "submit tomorrow"
 * is resolved relative to last week and is now overdue.
 */

export interface TimeLeftMeter {
  label: string;
  status: "urgent" | "normal" | "overdue" | "uncertain";
  targetDate: Date | null;
  hoursLeft?: number;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

/**
 * Parses message timestamp: "DD/MM/YYYY, HH:mm" or "DD/MM/YYYY, h:mm am/pm"
 */
export function parseMessageTimestamp(timestampStr: string): Date {
  const clean = timestampStr.replace(/[\u202F\u00A0]/g, " ").trim();
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AP]M))?)?/i);

  if (!match) {
    return new Date(); // fallback if unparseable
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  let year = parseInt(match[3], 10);
  if (year < 100) year += 2000;

  let hours = match[4] ? parseInt(match[4], 10) : 12;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;
  const ampm = match[6] ? match[6].toUpperCase() : null;

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return new Date(year, month, day, hours, minutes, 0);
}

/**
 * Extracts explicit time of day if mentioned in phrase (e.g. "5:00 PM", "11:59 PM", "2 PM")
 */
function extractTimeOfDay(phrase: string): { hours: number; minutes: number } | null {
  const match = phrase.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3].toLowerCase().replace(/\./g, "");
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    return { hours, minutes };
  }
  return null;
}

/**
 * Resolves a date phrase relative to baseDate (the message's timestamp).
 */
export function resolveDatePhrase(
  datePhrase: string | null | undefined,
  baseDate: Date
): { resolvedDate: Date | null; isUncertain: boolean } {
  if (!datePhrase || !datePhrase.trim()) {
    return { resolvedDate: null, isUncertain: true };
  }

  const phrase = datePhrase.toLowerCase().trim();

  // Uncertain indicators (plan.md Section 4.1 Feature #11)
  if (
    phrase.includes("soon") ||
    phrase.includes("later") ||
    phrase.includes("before midterm") ||
    phrase.includes("sometime") ||
    phrase.includes("asap") ||
    phrase.includes("in a few days")
  ) {
    return { resolvedDate: null, isUncertain: true };
  }

  const timeSpec = extractTimeOfDay(phrase);
  const defaultHours = timeSpec ? timeSpec.hours : 23;
  const defaultMinutes = timeSpec ? timeSpec.minutes : 59;

  // 1. "tomorrow"
  if (phrase.includes("tomorrow") && !phrase.includes("day after tomorrow")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    d.setHours(defaultHours, defaultMinutes, 0, 0);
    return { resolvedDate: d, isUncertain: false };
  }

  // 2. "day after tomorrow"
  if (phrase.includes("day after tomorrow")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    d.setHours(defaultHours, defaultMinutes, 0, 0);
    return { resolvedDate: d, isUncertain: false };
  }

  // 3. "today" or "tonight"
  if (phrase.includes("today") || phrase.includes("tonight")) {
    const d = new Date(baseDate);
    d.setHours(defaultHours, defaultMinutes, 0, 0);
    return { resolvedDate: d, isUncertain: false };
  }

  // 4. Explicit date pattern: e.g. "15th Oct", "Sunday 18th Oct", "October 18"
  const dayMonthMatch = phrase.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthKey = dayMonthMatch[2].toLowerCase();
    if (MONTH_NAMES[monthKey] !== undefined) {
      const month = MONTH_NAMES[monthKey];
      const year = baseDate.getFullYear();
      const d = new Date(year, month, day, defaultHours, defaultMinutes, 0);
      return { resolvedDate: d, isUncertain: false };
    }
  }

  // Month day pattern: e.g. "Oct 15", "October 15th"
  const monthDayMatch = phrase.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (monthDayMatch) {
    const monthKey = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    if (MONTH_NAMES[monthKey] !== undefined) {
      const month = MONTH_NAMES[monthKey];
      const year = baseDate.getFullYear();
      const d = new Date(year, month, day, defaultHours, defaultMinutes, 0);
      return { resolvedDate: d, isUncertain: false };
    }
  }

  // 5. Day of week pattern: e.g. "this Thursday", "Friday", "by Sunday"
  for (const [dayName, targetDayIndex] of Object.entries(WEEKDAY_NAMES)) {
    if (phrase.includes(dayName)) {
      const currentDay = baseDate.getDay();
      let diff = targetDayIndex - currentDay;
      if (diff <= 0) diff += 7; // next occurrence of that weekday
      const d = new Date(baseDate);
      d.setDate(d.getDate() + diff);
      d.setHours(defaultHours, defaultMinutes, 0, 0);
      return { resolvedDate: d, isUncertain: false };
    }
  }

  return { resolvedDate: null, isUncertain: true };
}

/**
 * Computes Time-Left Meter chip/label against reference date.
 * (plan.md Section 4.1 Feature #3: Red under 24h, "Overdue", "Uncertain date")
 */
export function computeTimeLeft(
  targetDate: Date | null,
  referenceDate: Date = new Date()
): TimeLeftMeter {
  if (!targetDate) {
    return {
      label: "Uncertain date",
      status: "uncertain",
      targetDate: null
    };
  }

  const diffMs = targetDate.getTime() - referenceDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    const overdueDays = Math.floor(overdueHours / 24);
    const label =
      overdueDays > 0
        ? `Overdue by ${overdueDays}d`
        : `Overdue by ${Math.max(1, Math.round(overdueHours))}h`;

    return {
      label,
      status: "overdue",
      targetDate,
      hoursLeft: diffHours
    };
  }

  // Under 24h: Urgent (Red badge)
  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    const label = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;

    return {
      label,
      status: "urgent",
      targetDate,
      hoursLeft: diffHours
    };
  }

  // Greater than 24h: Normal (e.g. "2d 4h left")
  const days = Math.floor(diffHours / 24);
  const remainingHours = Math.round(diffHours % 24);
  const label = `${days}d ${remainingHours}h left`;

  return {
    label,
    status: "normal",
    targetDate,
    hoursLeft: diffHours
  };
}
