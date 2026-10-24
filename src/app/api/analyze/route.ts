import { NextResponse } from "next/server";
import { z } from "zod";
import { parseChat } from "@/lib/parser";
import { runAnalysisPipeline } from "@/lib/pipeline";
import { processChatItems } from "@/lib/change-tracker";
import { RawChatMessage } from "@/lib/types";

const AnalyzeRequestSchema = z.object({
  rawText: z.string().optional(),
  messages: z.array(z.any()).optional(),
  mock: z.boolean().optional(),
  fallbackTimestamp: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsedRequest = AnalyzeRequestSchema.safeParse(json);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsedRequest.error.format()
        },
        { status: 400 }
      );
    }

    const { rawText, messages: directMessages, mock, fallbackTimestamp } = parsedRequest.data;

    let chatMessages: RawChatMessage[] = [];
    let parseDetails = null;

    if (rawText && rawText.trim().length > 0) {
      const parseResult = parseChat(rawText, fallbackTimestamp);
      chatMessages = parseResult.messages;
      parseDetails = {
        isWhatsAppFormat: parseResult.isWhatsAppFormat,
        totalLines: parseResult.totalLines,
        filteredSystemMessages: parseResult.filteredSystemMessages,
        warnings: parseResult.warnings
      };
    } else if (Array.isArray(directMessages) && directMessages.length > 0) {
      chatMessages = directMessages as RawChatMessage[];
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "No chat text or messages provided for analysis."
        },
        { status: 400 }
      );
    }

    if (chatMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse any messages from the provided input."
        },
        { status: 422 }
      );
    }

    const isDemoChat =
      mock === true ||
      (rawText && (
        rawText.includes("Project Phase 1 submission") ||
        rawText.includes("amit.kumar@okhdfcbank") ||
        rawText.includes("sbi-yono-secure-kyc")
      ));

    const pipelineResult = await runAnalysisPipeline(chatMessages, {
      mock: Boolean(isDemoChat)
    });

    const processed = processChatItems(pipelineResult.items, chatMessages);

    return NextResponse.json({
      success: true,
      parseDetails,
      messages: chatMessages,
      analysis: pipelineResult,
      processed: {
        tasks: processed.tasks,
        changeFeed: processed.changeFeed,
        bills: processed.bills,
        info: processed.info,
        fraud: processed.fraud
      }
    });
  } catch (err: unknown) {
    console.error("API /api/analyze error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
