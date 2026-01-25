/**
 * API Route: /api/consult
 * Handles AI-powered consult step generation
 */

import { NextRequest, NextResponse } from "next/server";
import { createAIClient } from "@/lib/ai/client";
import { getPromptForStep } from "@/lib/ai/prompts";
import { ConsultSelections, ConsultStep } from "@/types/habit";

export const runtime = "nodejs";

interface ConsultRequest {
  step: "success_week" | "action" | "orientation" | "anchor" | "habit_select" | "system_design";
  selections: ConsultSelections;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsultRequest = await request.json();
    const { step, selections } = body;

    // Validate request
    if (!step || !selections) {
      return NextResponse.json(
        { error: "Missing required fields: step, selections" },
        { status: 400 }
      );
    }

    // Map step to expected ConsultStep type
    const stepMap: Record<string, ConsultStep> = {
      success_week: "success_week",
      action: "action",
      orientation: "orientation",
      anchor: "anchor",
      habit_select: "habit_select",
      system_design: "system_design",
    };

    const expectedStep = stepMap[step];
    if (!expectedStep) {
      return NextResponse.json(
        { error: `Invalid step: ${step}` },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = getPromptForStep(step, selections);

    // Call AI
    const client = createAIClient();
    const result = await client.generateStepResponse({
      prompt,
      expectedStep,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      response: result.response,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Consult API error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    // Check if it's an API key error
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        {
          error: "AI service not configured",
          fallback: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
