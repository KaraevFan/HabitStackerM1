import { NextRequest, NextResponse } from 'next/server';
import { buildTuneUpSystemPrompt, TuneUpResponse } from '@/lib/ai/prompts/tuneUpAgent';

interface TuneUpRequest {
  habitInfo: {
    anchor: string;
    action: string;
    repsCompleted: number;
  };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}

/**
 * Call Claude API (Anthropic) with Haiku model for cost efficiency
 */
async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<TuneUpResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022', // Use Haiku for cost efficiency
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Claude');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]) as TuneUpResponse;
}

export async function POST(request: NextRequest) {
  try {
    const body: TuneUpRequest = await request.json();
    const { habitInfo, conversationHistory, userMessage } = body;

    if (!habitInfo?.anchor || !habitInfo?.action) {
      return NextResponse.json(
        { error: 'Missing habit info' },
        { status: 400 }
      );
    }

    const systemPrompt = buildTuneUpSystemPrompt(habitInfo);

    // Build messages array for API
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message (or start prompt)
    if (userMessage) {
      messages.push({
        role: 'user',
        content: userMessage,
      });
    } else if (messages.length === 0) {
      // First message to start conversation
      messages.push({
        role: 'user',
        content: "Let's start the tune-up conversation.",
      });
    }

    let tuneUpResponse: TuneUpResponse;
    try {
      tuneUpResponse = await callClaude(systemPrompt, messages);
    } catch (parseError) {
      console.error('Failed to get/parse tune-up response:', parseError);
      // Return fallback response
      tuneUpResponse = {
        message: "Let's set up your system. What almost got in the way of your habit today?",
        suggestedResponses: ["I almost forgot", "I didn't have enough time", "I wasn't motivated"],
        phase: 'friction',
        extractedData: {},
        isComplete: false,
      };
    }

    return NextResponse.json({
      response: tuneUpResponse,
    });
  } catch (error) {
    console.error('Tune-up API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process tune-up request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
