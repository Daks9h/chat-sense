import { z } from "zod";

export const MessageCategoryEnum = z.enum([
  "task",
  "deadline",
  "change",
  "info",
  "bill",
  "promo",
  "suspicious",
  "noise"
]);
export type MessageCategory = z.infer<typeof MessageCategoryEnum>;

export const FraudSignalEnum = z.enum([
  "urgency",
  "fake_authority",
  "kyc_threat",
  "prize_lure",
  "payment_request"
]);
export type FraudSignal = z.infer<typeof FraudSignalEnum>;

export const ConfidenceEnum = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof ConfidenceEnum>;

export const TaskSchema = z.object({
  title: z.string(),
  date_phrase: z.string().nullable().optional(),
  assignee: z.string().nullable().optional()
});
export type TaskData = z.infer<typeof TaskSchema>;

export const BillSchema = z.object({
  payee: z.string(),
  amount: z.number().nullable().optional(),
  currency: z.literal("INR").default("INR"),
  due_phrase: z.string().nullable().optional()
});
export type BillData = z.infer<typeof BillSchema>;

export const InfoSchema = z.object({
  label: z.string(),
  value: z.string()
});
export type InfoData = z.infer<typeof InfoSchema>;

export const MessageAnalysisSchema = z.object({
  message_id: z.string(),
  category: MessageCategoryEnum,
  task: TaskSchema.nullable().optional(),
  updates_task_hint: z.string().nullable().optional(),
  bill: BillSchema.nullable().optional(),
  info: InfoSchema.nullable().optional(),
  fraud_signals: z.array(FraudSignalEnum).default([]),
  source_quote: z.string(),
  confidence: ConfidenceEnum.default("medium")
});
export type MessageAnalysis = z.infer<typeof MessageAnalysisSchema>;

export const BatchAnalysisResultSchema = z.object({
  items: z.array(MessageAnalysisSchema),
  timing: z.object({
    prompt_eval_count: z.number().optional(),
    eval_count: z.number().optional(),
    eval_duration_sec: z.number().optional(),
    tokens_per_second: z.number().optional(),
    total_duration_ms: z.number()
  }),
  model: z.string(),
  processor: z.string().optional()
});
export type BatchAnalysisResult = z.infer<typeof BatchAnalysisResultSchema>;

export interface RawChatMessage {
  id: string;
  timestamp: string; // e.g. "15/08/2026, 14:30"
  sender: string;
  text: string;
  raw: string;
}
