import { NextRequest } from 'next/server';
import {
  buildRecoveryCoachSystemPrompt,
  buildRecoveryCoachUserPrompt,
  buildRecoveryCoachOpenerPrompt,
  RecoveryCoachContext,
  RecoveryCoachResponse,
  validateRecoveryCoachResponse,
} from '@/lib/ai/prompts/recoveryCoachAgent';

interface RecoveryRequest {
  context: RecoveryCoachContext;
  userMessage?: string; // Optional - if not provided, generates opening message
}

type AIProvider = 'anthropic' | 'openai';

/**
 * Get AI provider configuration from environment
 */
function getProviderConfig(): { provider: AIProvider; apiKey: string; model: string } {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return {
      provider: 'openai',
      apiKey,
      model: process.env.OPENAI_REFLECTION_MODEL || 'gpt-4o-mini',
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    provider: 'anthropic',
    apiKey,
    model: process.env.ANTHROPIC_REFLECTION_MODEL || 'claude-sonnet-4-5',
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Recovery] Anthropic API error:', response.status, error);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('No content in Anthropic response');
  }

  return content;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Recovery] OpenAI API error:', response.status, error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return content;
}

/**
 * Parse AI response and extract JSON
 */
function parseResponse(content: string): RecoveryCoachResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.warn('[Recovery] No JSON found, wrapping plain text:', content.substring(0, 100));
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validation = validateRecoveryCoachResponse(parsed);

    if (validation.valid) {
      return parsed as RecoveryCoachResponse;
    }

    console.warn('[Recovery] Invalid response format:', validation.reason);

    // Try to salvage what we can
    if (typeof parsed.message === 'string') {
      return {
        message: parsed.message,
        suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies : null,
        shouldClose: typeof parsed.shouldClose === 'boolean' ? parsed.shouldClose : false,
        frictionNote: typeof parsed.frictionNote === 'string' ? parsed.frictionNote : undefined,
        recoveryAccepted: typeof parsed.recoveryAccepted === 'boolean' ? parsed.recoveryAccepted : undefined,
        systemChangeProposed: parsed.systemChangeProposed && typeof parsed.systemChangeProposed === 'object'
          ? parsed.systemChangeProposed
          : undefined,
        missReason: typeof parsed.missReason === 'string' ? parsed.missReason : undefined,
      };
    }

    throw new Error('Could not salvage response');
  } catch (e) {
    console.error('[Recovery] JSON parse error:', e);
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }
}

/**
 * Recovery Coach API endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body: RecoveryRequest = await request.json();
    const { context, userMessage } = body;

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Context is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = getProviderConfig();
    const systemPrompt = buildRecoveryCoachSystemPrompt();

    const userPrompt = userMessage
      ? buildRecoveryCoachUserPrompt(context, userMessage)
      : buildRecoveryCoachOpenerPrompt(context);

    console.log('[Recovery] Calling AI with context:', {
      repCount: context.patterns?.completedCount,
      userGoal: context.userGoal?.substring(0, 50),
      hasUserMessage: !!userMessage,
      exchangeCount: context.exchangeCount,
    });

    let content: string;

    if (config.provider === 'openai') {
      content = await callOpenAI(config.apiKey, config.model, systemPrompt, userPrompt);
    } else {
      content = await callAnthropic(config.apiKey, config.model, systemPrompt, userPrompt);
    }

    console.log('[Recovery] AI response:', content.substring(0, 200));

    const response = parseResponse(content);

    if (response.recoveryAccepted) {
      console.log('[Recovery] Recovery accepted by user');
    }
    if (response.systemChangeProposed) {
      console.log('[Recovery] System change proposed:', response.systemChangeProposed);
    }
    if (response.missReason) {
      console.log('[Recovery] Miss reason extracted:', response.missReason);
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Recovery] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
