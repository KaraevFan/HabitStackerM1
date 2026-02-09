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

/**
 * Stream from Anthropic API
 */
async function streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
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
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[WeeklyReflection] Anthropic API error:', response.status, error);
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullContent += parsed.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: parsed.delta.text })}\n\n`)
            );
          }

          if (parsed.type === 'message_stop') {
            return fullContent;
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  }

  return fullContent;
}

/**
 * Stream from OpenAI API
 */
async function streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[WeeklyReflection] OpenAI API error:', response.status, error);
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            fullContent += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`)
            );
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  }

  return fullContent;
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
  const encoder = new TextEncoder();

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
    const systemPrompt = buildWeeklyReflectionSystemPrompt(
      context.reflectionType,
      context.system,
      context.weekNumber
    );

    const userPrompt = userMessage
      ? buildWeeklyReflectionUserPrompt(context, userMessage)
      : buildWeeklyReflectionOpenerPrompt(context);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent: string;

          if (config.provider === 'openai') {
            fullContent = await streamOpenAI(
              config.apiKey,
              config.model,
              systemPrompt,
              userPrompt,
              controller,
              encoder
            );
          } else {
            fullContent = await streamAnthropic(
              config.apiKey,
              config.model,
              systemPrompt,
              userPrompt,
              controller,
              encoder
            );
          }

          // Parse the full JSON response
          console.log('[WeeklyReflection] Full content received:', fullContent.substring(0, 500));
          const response = parseResponse(fullContent);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, response })}\n\n`)
          );

          controller.close();
        } catch (error) {
          console.error('[WeeklyReflection] Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[WeeklyReflection] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
