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
    console.error('[Recovery] Anthropic API error:', response.status, error);
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
    console.error('[Recovery] OpenAI API error:', response.status, error);
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
 * Recovery Coach streaming API endpoint
 * Uses Server-Sent Events to stream the response
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

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

          console.log('[Recovery] AI response:', fullContent.substring(0, 200));

          const response = parseResponse(fullContent);

          if (response.recoveryAccepted) {
            console.log('[Recovery] Recovery accepted by user');
          }
          if (response.systemChangeProposed) {
            console.log('[Recovery] System change proposed:', response.systemChangeProposed);
          }
          if (response.missReason) {
            console.log('[Recovery] Miss reason extracted:', response.missReason);
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
    console.error('[Recovery] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
