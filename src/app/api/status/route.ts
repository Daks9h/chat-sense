import { NextResponse } from "next/server";
import { checkActiveAIStatus, getActiveProvider } from "@/lib/ai-provider";

export async function GET() {
  const status = await checkActiveAIStatus();
  const provider = getActiveProvider();

  return NextResponse.json({
    ...status,
    activeProvider: provider
  });
}
