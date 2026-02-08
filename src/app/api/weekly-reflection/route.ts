import { NextRequest } from 'next/server';
import {
  buildWeeklyReflectionSystemPrompt,
  buildWeeklyReflectionUserPrompt,
  buildWeeklyReflectionOpenerPrompt,
  WeeklyReflectionContext,
  WeeklyReflectionResponse,
  validateWeeklyReflectionResponse,
} from '@/lib/ai/prompts/weeklyReflectionAgent';

interface WeeklyReflectionRequest {
  context: WeeklyReflectionContext;
  userMessage?: string;
}

type AIProvider = 'anthropic' | 'openai';

function getProviderConfig(): { provider: AIProvider; apiKey: string; model: string } {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return {
      provider: 'openai',
      apiKey,
      model: process.env.OPENAI_REFLECTION_MODEL || 'gpt-4o',
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    provider: 'anthropic',
    apiKey,
    // Use Sonnet for weekly reflection (quality matters)
    model: process.env.ANTHROPIC_WEEKLY_REFLECTION_MODEL || 'claude-sonnet-4-5-20250929',
  };
}

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
    console.error('[WeeklyReflection] Anthropic API error:', response.status, error);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

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
    console.error('[WeeklyReflection] OpenAI API error:', response.status, error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseResponse(content: string): WeeklyReflectionResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validation = validateWeeklyReflectionResponse(parsed);

    if (validation.valid) {
      return parsed as WeeklyReflectionResponse;
    }

    // Salvage what we can
    if (typeof parsed.message === 'string') {
      return {
        message: parsed.message,
        suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies : null,
        shouldClose: typeof parsed.shouldClose === 'boolean' ? parsed.shouldClose : false,
        sustainability: parsed.sustainability,
        friction: typeof parsed.friction === 'string' ? parsed.friction : undefined,
        recommendation: parsed.recommendation || null,
      };
    }

    throw new Error('Could not salvage response');
  } catch {
    return {
      message: content.trim(),
      suggestedReplies: null,
      shouldClose: false,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyReflectionRequest = await request.json();
    const { context, userMessage } = body;

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Context is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = getProviderConfig();
    const systemPrompt = buildWeeklyReflectionSystemPrompt(context.reflectionType);

    const userPrompt = userMessage
      ? buildWeeklyReflectionUserPrompt(context, userMessage)
      : buildWeeklyReflectionOpenerPrompt(context);

    let content: string;

    if (config.provider === 'openai') {
      content = await callOpenAI(config.apiKey, config.model, systemPrompt, userPrompt);
    } else {
      content = await callAnthropic(config.apiKey, config.model, systemPrompt, userPrompt);
    }

    const response = parseResponse(content);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WeeklyReflection] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
