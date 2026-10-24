import { RawChatMessage } from "./types";

/**
 * Android WhatsApp regex patterns supporting both 12h and 24h formats,
 * including optional comma, seconds, and Unicode non-breaking spaces (\u202F / \u00A0).
 *
 * Examples:
 * 15/08/2026, 14:30 - Priya: Hey team
 * 15/08/2026, 2:30 pm - Priya: Hey team
 * 15/08/26, 02:30 PM - Priya: Hey team
 */
const ANDROID_WHATSAPP_REGEX =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*([ap]\.?m\.?))?\s*-\s*([^:]+):\s*(.*)$/i;

const SYSTEM_MESSAGE_REGEX =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*([ap]\.?m\.?))?\s*-\s*(.*)$/i;

export interface ParseResult {
  messages: RawChatMessage[];
  isWhatsAppFormat: boolean;
  totalLines: number;
  filteredSystemMessages: number;
  warnings: string[];
}

/**
 * Normalizes WhatsApp non-breaking spaces and line breaks.
 */
function cleanLine(line: string): string {
  return line.replace(/[\u202F\u00A0]/g, " ").trimEnd();
}

/**
 * Parses raw chat input (WhatsApp export or raw pasted chat).
 */
export function parseChat(rawText: string, fallbackTimestamp?: string): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const messages: RawChatMessage[] = [];
  const warnings: string[] = [];
  let filteredSystemCount = 0;
  let isWhatsAppFormat = false;

  let currentMsg: RawChatMessage | null = null;
  let messageCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = cleanLine(lines[i]);
    if (!rawLine.trim()) continue;

    const match = rawLine.match(ANDROID_WHATSAPP_REGEX);

    if (match) {
      isWhatsAppFormat = true;
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const dateStr = match[1];
      const timeStr = match[2];
      const ampmStr = match[3] ? ` ${match[3].toUpperCase().replace(/\./g, "")}` : "";
      const sender = match[4].trim();
      const text = match[5].trim();

      const timestamp = `${dateStr}, ${timeStr}${ampmStr}`;
      const id = `m_${String(messageCounter++).padStart(3, "0")}`;

      currentMsg = {
        id,
        timestamp,
        sender,
        text,
        raw: rawLine
      };
    } else if (SYSTEM_MESSAGE_REGEX.test(rawLine)) {
      // System message without sender (e.g. "Messages and calls are end-to-end encrypted")
      filteredSystemCount++;
    } else {
      // Check if this is a new message in plain text format (e.g. "Speaker: Text")
      const plainSpeakerMatch = rawLine.match(/^([A-Za-z0-9 _+.-]{1,35}):\s+(.+)$/);

      if (!isWhatsAppFormat && plainSpeakerMatch && currentMsg) {
        // In plain text mode, a new "Speaker: text" line is a new message
        messages.push(currentMsg);
        const id = `m_${String(messageCounter++).padStart(3, "0")}`;
        const timestamp = fallbackTimestamp || "Pasted Message";
        currentMsg = {
          id,
          timestamp,
          sender: plainSpeakerMatch[1].trim(),
          text: plainSpeakerMatch[2].trim(),
          raw: rawLine
        };
      } else if (currentMsg) {
        // Continuation line of previous message
        currentMsg.text += `\n${rawLine}`;
        currentMsg.raw += `\n${rawLine}`;
      } else {
        // Plain text initial message
        const id = `m_${String(messageCounter++).padStart(3, "0")}`;
        const timestamp = fallbackTimestamp || "Pasted Message";

        let sender = "Sender";
        let text = rawLine;

        if (plainSpeakerMatch) {
          sender = plainSpeakerMatch[1].trim();
          text = plainSpeakerMatch[2].trim();
        }

        currentMsg = {
          id,
          timestamp,
          sender,
          text,
          raw: rawLine
        };
      }
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  if (!isWhatsAppFormat && messages.length > 0) {
    warnings.push("Input does not use standard WhatsApp timestamp headers. Assigned incremental identifiers.");
  }

  return {
    messages,
    isWhatsAppFormat,
    totalLines: lines.length,
    filteredSystemMessages: filteredSystemCount,
    warnings
  };
}
