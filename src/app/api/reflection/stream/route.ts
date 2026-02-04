import { NextRequest } from 'next/server';
import {
  buildReflectionSystemPrompt,
  buildReflectionUserPrompt,
  buildReflectionOpenerPrompt,
  ReflectionContext,
  ReflectionAgentResponse,
  validateReflectionResponse,
} from '@/lib/ai/prompts/reflectionAgent';

interface ReflectionRequest {
  context: ReflectionContext;
  userMessage?: string; // Optional - if not provided, generates opening message
}

type AIProvider = 'anthropic' | 'openai';

/**
 * Get AI provider configuration from environment
 * Uses Haiku by default for reflection (cost-efficient for daily use)
 */
function getProviderConfig(): { provider: AIProvider; apiKey: string; model: string } {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return {
      provider: 'openai',
      apiKey,
      // Use GPT-4o-mini for reflection (cost-efficient)
      model: process.env.OPENAI_REFLECTION_MODEL || 'gpt-4o-mini',
    };
  }

  // Default: Anthropic with Sonnet for reflection
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    provider: 'anthropic',
    apiKey,
    // Use Claude Sonnet 4.5 for reflection
    model: process.env.ANTHROPIC_REFLECTION_MODEL || 'claude-sonnet-4-5',
  };
}

/**
 * Call Anthropic API (non-streaming for simplicity)
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
    console.error('[Reflection] Anthropic API error:', response.status, error);
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
 * Call OpenAI API (non-streaming for simplicity)
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
    console.error('[Reflection] OpenAI API error:', response.status, error);
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
function parseResponse(content: string): ReflectionAgentResponse {
  // Try to extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.warn('[Reflection] No JSON found, wrapping plain text:', content.substring(0, 100));
    // Fallback: wrap plain text as a response
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validation = validateReflectionResponse(parsed);

    if (validation.valid) {
      return parsed as ReflectionAgentResponse;
    }

    console.warn('[Reflection] Invalid response format:', validation.reason);

    // Try to salvage what we can
    if (typeof parsed.message === 'string') {
      // Extract reflectionSummary if it's valid
      let reflectionSummary = undefined;
      if (parsed.reflectionSummary && typeof parsed.reflectionSummary === 'object') {
        const rs = parsed.reflectionSummary;
        if (typeof rs.summary === 'string') {
          reflectionSummary = {
            summary: rs.summary,
            quantitative: typeof rs.quantitative === 'string' ? rs.quantitative : undefined,
            sentiment: ['positive', 'neutral', 'challenging'].includes(rs.sentiment) ? rs.sentiment : undefined,
            frictionNote: typeof rs.frictionNote === 'string' ? rs.frictionNote : undefined,
          };
        }
      }

      return {
        message: parsed.message,
        suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies : null,
        shouldClose: typeof parsed.shouldClose === 'boolean' ? parsed.shouldClose : false,
        frictionNote: typeof parsed.frictionNote === 'string' ? parsed.frictionNote : undefined,
        reflectionSummary,
      };
    }

    throw new Error('Could not salvage response');
  } catch (e) {
    console.error('[Reflection] JSON parse error:', e);
    // Last resort: use the raw content
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }
}

/**
 * Reflection API endpoint
 * Non-streaming for simplicity (reflection responses are short)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReflectionRequest = await request.json();
    const { context, userMessage } = body;

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Context is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = getProviderConfig();
    const systemPrompt = buildReflectionSystemPrompt();

    // Build the appropriate prompt
    const userPrompt = userMessage
      ? buildReflectionUserPrompt(context, userMessage)
      : buildReflectionOpenerPrompt(context);

    console.log('[Reflection] Calling AI with context:', {
      repCount: context.patterns?.completedCount,
      isFirstRep: context.patterns?.isFirstRep,
      userGoal: context.userGoal?.substring(0, 50),
      hasUserMessage: !!userMessage,
    });

    // Call the AI
    let content: string;

    if (config.provider === 'openai') {
      content = await callOpenAI(config.apiKey, config.model, systemPrompt, userPrompt);
    } else {
      content = await callAnthropic(config.apiKey, config.model, systemPrompt, userPrompt);
    }

    console.log('[Reflection] AI response:', content.substring(0, 200));

    // Parse the response
    const response = parseResponse(content);

    // Log what we extracted
    if (response.reflectionSummary) {
      console.log('[Reflection] Extracted summary:', response.reflectionSummary);
    } else {
      console.log('[Reflection] No reflectionSummary in response');
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Reflection] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
