export interface OllamaOptions {
  num_ctx?: number;
  temperature?: number;
}

export interface OllamaMetrics {
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration_sec?: number;
  tokens_per_second?: number;
  total_duration_ms: number;
}

export interface OllamaResponse {
  response: string;
  model: string;
  metrics: OllamaMetrics;
}

export function getOllamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    modelTag: process.env.GEMMA_MODEL_TAG || "gemma4:e2b",
    numCtx: parseInt(process.env.GEMMA_NUM_CTX || "4096", 10),
    mockMode: process.env.MOCK_MODE === "true"
  };
}

export async function checkOllamaStatus(): Promise<{
  online: boolean;
  modelInstalled: boolean;
  modelTag: string;
  runningOnGpu?: boolean;
  processor?: string;
  error?: string;
}> {
  const { baseUrl, modelTag, mockMode } = getOllamaConfig();

  if (mockMode) {
    return {
      online: true,
      modelInstalled: true,
      modelTag: `${modelTag} (MOCK MODE)`,
      runningOnGpu: true,
      processor: "100% GPU (Simulated)"
    };
  }

  try {
    // 1. Check tags
    const tagsRes = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000)
    });

    if (!tagsRes.ok) {
      return {
        online: false,
        modelInstalled: false,
        modelTag,
        error: `Ollama returned HTTP ${tagsRes.status}`
      };
    }

    const tagsData = (await tagsRes.json()) as { models?: Array<{ name: string }> };
    const installed = tagsData.models?.some(
      (m) => m.name === modelTag || m.name === `${modelTag}:latest`
    ) ?? false;

    // 2. Check running process status (/api/ps)
    let processor = "Not loaded yet";
    let runningOnGpu = false;

    try {
      const psRes = await fetch(`${baseUrl}/api/ps`, {
        method: "GET",
        signal: AbortSignal.timeout(2000)
      });
      if (psRes.ok) {
        const psData = (await psRes.json()) as {
          models?: Array<{ name: string; processor?: string }>;
        };
        const active = psData.models?.find(
          (m) => m.name === modelTag || m.name.startsWith(modelTag)
        );
        if (active && active.processor) {
          processor = active.processor;
          runningOnGpu = processor.toLowerCase().includes("gpu");
        }
      }
    } catch {
      // ps check is non-fatal
    }

    return {
      online: true,
      modelInstalled: installed,
      modelTag,
      runningOnGpu,
      processor
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      online: false,
      modelInstalled: false,
      modelTag,
      error: errorMsg
    };
  }
}

export async function queryOllama(
  prompt: string,
  options?: OllamaOptions
): Promise<OllamaResponse> {
  const { baseUrl, modelTag, numCtx, mockMode } = getOllamaConfig();

  if (mockMode) {
    // Return simulated fast response for demo / testing
    return {
      response: "[]",
      model: `${modelTag} (mock)`,
      metrics: {
        prompt_eval_count: 50,
        eval_count: 120,
        eval_duration_sec: 0.1,
        tokens_per_second: 1200,
        total_duration_ms: 120
      }
    };
  }

  const startTime = Date.now();
  const contextSize = options?.num_ctx ?? numCtx;
  const temperature = options?.temperature ?? 0.1; // low temperature for extraction

  const body = {
    model: modelTag,
    prompt,
    stream: false,
    format: "json", // Request JSON mode
    options: {
      num_ctx: contextSize,
      temperature,
      thinking: false // Disable extended thinking mode for extraction
    }
  };

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama generation error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    response: string;
    model: string;
    prompt_eval_count?: number;
    eval_count?: number;
    eval_duration?: number;
    total_duration?: number;
  };

  const totalDurationMs = Date.now() - startTime;
  const evalDurationSec = data.eval_duration ? data.eval_duration / 1e9 : undefined;
  const tokensPerSec =
    data.eval_count && evalDurationSec && evalDurationSec > 0
      ? data.eval_count / evalDurationSec
      : undefined;

  return {
    response: data.response,
    model: data.model || modelTag,
    metrics: {
      prompt_eval_count: data.prompt_eval_count,
      eval_count: data.eval_count,
      eval_duration_sec: evalDurationSec,
      tokens_per_second: tokensPerSec ? Math.round(tokensPerSec * 10) / 10 : undefined,
      total_duration_ms: totalDurationMs
    }
  };
}
