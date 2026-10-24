import { RawChatMessage, MessageAnalysis, BatchAnalysisResult } from "./types";
import { analyzeMessageBatch } from "./extractor";
import { MOCK_ANALYSIS_ITEMS } from "./mock-data";
import { getActiveProvider } from "./ai-provider";
import { extractDeterministically } from "./deterministic-extractor";

export interface PipelineProgress {
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export interface PipelineResult {
  items: MessageAnalysis[];
  unparsedMessageIds: string[];
  totalMessages: number;
  totalBatches: number;
  timing: {
    totalDurationMs: number;
    tokensPerSecond?: number;
    totalTokensGenerated: number;
    totalPromptTokens: number;
  };
  model: string;
  provider: string;
}

/**
 * Splits array into chunks of given size.
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Analyzes full chat across batches of 10 to 15 messages.
 */
export async function runAnalysisPipeline(
  messages: RawChatMessage[],
  options?: {
    batchSize?: number;
    mock?: boolean;
    onBatchComplete?: (progress: PipelineProgress, batchResult: BatchAnalysisResult) => void;
  }
): Promise<PipelineResult> {
  const startTime = Date.now();
  // Optimized batch sizing: short chats up to 25 messages are processed in a single fast batch
  const batchSize = options?.batchSize || (messages.length <= 25 ? messages.length : 20);
  const isMock = options?.mock || process.env.MOCK_MODE === "true";
  const provider = getActiveProvider();

  // If mock mode is requested or active, return pre-cached items immediately
  if (isMock) {
    return {
      items: MOCK_ANALYSIS_ITEMS.slice(0, messages.length),
      unparsedMessageIds: [],
      totalMessages: messages.length,
      totalBatches: 1,
      timing: {
        totalDurationMs: 80,
        tokensPerSecond: 1500,
        totalTokensGenerated: 850,
        totalPromptTokens: 420
      },
      model: "Mock Mode (Instant Pre-cached)",
      provider: "mock"
    };
  }

  const batches = chunkArray(messages, batchSize);
  const allItems: MessageAnalysis[] = [];
  const unparsedIds: string[] = [];

  let totalTokensGenerated = 0;
  let totalPromptTokens = 0;
  let lastModel = "gemini-3.1-flash-lite";

  // If only 1 batch (e.g. short chat), execute directly
  if (batches.length === 1) {
    try {
      const batchResult = await analyzeMessageBatch(batches[0]);
      allItems.push(...batchResult.items);
      lastModel = batchResult.model;
      totalTokensGenerated += batchResult.timing.eval_count || 0;
      totalPromptTokens += batchResult.timing.prompt_eval_count || 0;

      const returnedIds = new Set(batchResult.items.map((it) => it.message_id));
      for (const m of batches[0]) {
        if (!returnedIds.has(m.id)) {
          unparsedIds.push(m.id);
        }
      }

      options?.onBatchComplete?.(
        {
          currentBatch: 1,
          totalBatches: 1,
          processedCount: messages.length,
          totalCount: messages.length
        },
        batchResult
      );
    } catch (batchErr) {
      console.warn("Single batch AI analysis failed or timed out, applying fast deterministic extraction:", batchErr);
      const fallbackItems = extractDeterministically(batches[0]);
      allItems.push(...fallbackItems);
      lastModel = "Gemma (Fast Heuristic Mode)";
    }
  } else {
    // Multi-batch execution: run in parallel with concurrency pool of 3
    const CONCURRENCY = 3;
    const batchResults: Array<{
      index: number;
      result?: BatchAnalysisResult;
      error?: unknown;
    }> = new Array(batches.length);

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const slice = batches.slice(i, i + CONCURRENCY);
      const promises = slice.map(async (batch, sliceIdx) => {
        const batchIdx = i + sliceIdx;
        try {
          const res = await analyzeMessageBatch(batch);
          batchResults[batchIdx] = { index: batchIdx, result: res };
          options?.onBatchComplete?.(
            {
              currentBatch: batchIdx + 1,
              totalBatches: batches.length,
              processedCount: Math.min((batchIdx + 1) * batchSize, messages.length),
              totalCount: messages.length
            },
            res
          );
        } catch (err) {
          console.warn(`Batch ${batchIdx + 1} AI timed out or failed, falling back to fast deterministic mode:`, err);
          const fallbackItems = extractDeterministically(batch);
          batchResults[batchIdx] = {
            index: batchIdx,
            result: {
              items: fallbackItems,
              timing: { total_duration_ms: 15 },
              model: "Gemma (Fast Heuristic Mode)"
            }
          };
        }
      });
      await Promise.all(promises);
    }

    // Assemble in correct original message order
    for (let b = 0; b < batches.length; b++) {
      const currentBatch = batches[b];
      const res = batchResults[b]?.result;
      if (res) {
        allItems.push(...res.items);
        lastModel = res.model;
        totalTokensGenerated += res.timing.eval_count || 0;
        totalPromptTokens += res.timing.prompt_eval_count || 0;

        const returnedIds = new Set(res.items.map((it) => it.message_id));
        for (const m of currentBatch) {
          if (!returnedIds.has(m.id)) {
            unparsedIds.push(m.id);
          }
        }
      } else {
        for (const m of currentBatch) {
          unparsedIds.push(m.id);
        }
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const durationSec = totalDurationMs / 1000;
  const tokensPerSecond =
    totalTokensGenerated > 0 && durationSec > 0
      ? Math.round((totalTokensGenerated / durationSec) * 10) / 10
      : undefined;

  return {
    items: allItems,
    unparsedMessageIds: unparsedIds,
    totalMessages: messages.length,
    totalBatches: batches.length,
    timing: {
      totalDurationMs,
      tokensPerSecond,
      totalTokensGenerated,
      totalPromptTokens
    },
    model: lastModel,
    provider
  };
}
