import { NextResponse } from "next/server";
import { SMOKE_TEST_MESSAGES } from "@/lib/smoke-test-data";
import { analyzeMessageBatch } from "@/lib/extractor";

export async function POST() {
  try {
    const analysis = await analyzeMessageBatch(SMOKE_TEST_MESSAGES);
    return NextResponse.json({
      success: true,
      data: analysis,
      messages: SMOKE_TEST_MESSAGES
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        messages: SMOKE_TEST_MESSAGES
      },
      { status: 500 }
    );
  }
}
