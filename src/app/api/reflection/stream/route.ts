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
    console.error('[Reflection] Anthropic API error:', response.status, error);
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
    console.error('[Reflection] OpenAI API error:', response.status, error);
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
 * Streaming reflection API endpoint
 * Uses Server-Sent Events to stream the response
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

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

    // Create streaming response
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

          console.log('[Reflection] AI response:', fullContent.substring(0, 200));

          // Parse the response
          const response = parseResponse(fullContent);

          // Log what we extracted
          if (response.reflectionSummary) {
            console.log('[Reflection] Extracted summary:', response.reflectionSummary);
          } else {
            console.log('[Reflection] No reflectionSummary in response');
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, response })}\n\n`)
          );

          controller.close();
        } catch (error) {
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
    console.error('[Reflection] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
