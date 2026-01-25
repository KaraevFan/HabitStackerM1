import { NextRequest, NextResponse } from 'next/server';
import {
  INTAKE_AGENT_SYSTEM_PROMPT,
  IntakeAgentResponse,
  isValidIntakeResponse,
} from '@/lib/ai/prompts/intakeAgent';

const MAX_RETRIES = 2;

interface IntakeRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  forceRecommend?: boolean; // Used when user clicks "I think you understand"
}

/**
 * Call Claude API (Anthropic)
 */
async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<IntakeAgentResponse> {
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
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      // Anthropic requires at least one message - use a start prompt if empty
      messages: messages.length > 0
        ? messages.map((m) => ({
            role: m.role,
            content: m.content,
          }))
        : [{ role: 'user', content: 'Hi, I want to build a habit.' }],
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

  // Parse JSON from response (Claude returns it as text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]) as IntakeAgentResponse;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<IntakeAgentResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return JSON.parse(content) as IntakeAgentResponse;
}

/**
 * Get the AI provider to use
 */
function getProvider(): 'anthropic' | 'openai' {
  // Prefer Anthropic if configured (tested prompt works well with Claude)
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}

export async function POST(request: NextRequest) {
  try {
    const body: IntakeRequest = await request.json();
    const { messages, forceRecommend } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build system prompt, optionally with force-recommend instruction
    let systemPrompt = INTAKE_AGENT_SYSTEM_PROMPT;
    if (forceRecommend) {
      systemPrompt += `\n\n[SYSTEM NOTE: The user has indicated they're ready for a recommendation. Move to reflection phase immediately, then recommendation. Do not ask more discovery questions.]`;
    }

    const provider = getProvider();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response =
          provider === 'anthropic'
            ? await callClaude(systemPrompt, messages)
            : await callOpenAI(systemPrompt, messages);

        // Validate response
        if (!isValidIntakeResponse(response)) {
          console.warn(`Invalid response format (attempt ${attempt}):`, response);
          if (attempt < MAX_RETRIES) continue;
          throw new Error('Invalid response format from AI');
        }

        return NextResponse.json({
          success: true,
          response,
          provider,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Intake API error (attempt ${attempt}):`, lastError.message);

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    return NextResponse.json(
      { error: lastError?.message || 'Failed to generate response' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Intake API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
