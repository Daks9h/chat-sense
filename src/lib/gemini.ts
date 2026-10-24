import { OllamaMetrics, OllamaResponse } from "./ollama";

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview"
  };
}

export async function checkGeminiStatus(): Promise<{
  online: boolean;
  modelInstalled: boolean;
  modelTag: string;
  runningOnGpu?: boolean;
  processor?: string;
  error?: string;
}> {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    return {
      online: false,
      modelInstalled: false,
      modelTag: model,
      error: "GEMINI_API_KEY is not configured"
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(4000)
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return {
        online: false,
        modelInstalled: false,
        modelTag: model,
        error: `Gemini API returned HTTP ${res.status}: ${err}`
      };
    }

    return {
      online: true,
      modelInstalled: true,
      modelTag: model,
      runningOnGpu: true,
      processor: "Google Cloud TPU/GPU Cloud Engine"
    };
  } catch (err: unknown) {
    return {
      online: false,
      modelInstalled: false,
      modelTag: model,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export async function queryGemini(prompt: string): Promise<OllamaResponse> {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }

  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Fast execution: disable thinking budget if supported by model (removes 60s+ CoT thinking delay)
  const isThinkingModel = model.includes("preview") || model.includes("flash") || model.includes("3.1");
  const requestBody: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    generationConfig: {
      responseMimeType: string;
      thinkingConfig?: { thinkingBudget: number };
    };
  } = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {})
    }
  };

  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  // If rejected because thinkingBudget is not supported, retry without thinkingConfig
  if (!res.ok && isThinkingModel) {
    const errText = await res.clone().text();
    if (errText.includes("Thinking budget") || errText.includes("invalid argument") || res.status === 400) {
      delete requestBody.generationConfig.thinkingConfig;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string; thought?: boolean }>;
      };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const totalDurationMs = Date.now() - startTime;
  const parts = data.candidates?.[0]?.content?.parts || [];
  // Gemma 4 output includes thoughts and actual response; pick the response part
  const answerPart = parts.find((p) => !p.thought) || parts[parts.length - 1];
  const responseText = answerPart?.text || "{}";

  const promptTokens = data.usageMetadata?.promptTokenCount || 0;
  const evalCount = data.usageMetadata?.candidatesTokenCount || 0;
  const durationSec = totalDurationMs / 1000;
  const tokensPerSec = evalCount > 0 && durationSec > 0 ? evalCount / durationSec : undefined;

  const metrics: OllamaMetrics = {
    prompt_eval_count: promptTokens,
    eval_count: evalCount,
    eval_duration_sec: durationSec,
    tokens_per_second: tokensPerSec ? Math.round(tokensPerSec * 10) / 10 : undefined,
    total_duration_ms: totalDurationMs
  };

  return {
    response: responseText,
    model: `Google API (${model})`,
    metrics
  };
}
