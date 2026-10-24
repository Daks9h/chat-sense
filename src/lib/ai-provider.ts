import { checkOllamaStatus, queryOllama, OllamaResponse } from "./ollama";
import { checkGeminiStatus, queryGemini } from "./gemini";

export type AIProviderType = "gemini" | "ollama" | "mock";

export function getActiveProvider(): AIProviderType {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "ollama") return "ollama";
  if (provider === "mock") return "mock";
  return "gemini";
}

export async function checkActiveAIStatus(): Promise<{
  provider: AIProviderType;
  online: boolean;
  modelInstalled: boolean;
  modelTag: string;
  runningOnGpu?: boolean;
  processor?: string;
  error?: string;
}> {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    const res = await checkGeminiStatus();
    return {
      provider: "gemini",
      ...res
    };
  }

  const res = await checkOllamaStatus();
  return {
    provider: "ollama",
    ...res
  };
}

export async function queryActiveAI(prompt: string): Promise<OllamaResponse> {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    return queryGemini(prompt);
  }

  return queryOllama(prompt);
}
