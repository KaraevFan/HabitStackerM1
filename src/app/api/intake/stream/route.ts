import { NextRequest } from 'next/server';
import {
  INTAKE_AGENT_SYSTEM_PROMPT,
  IntakeAgentResponse,
  isValidIntakeResponse,
} from '@/lib/ai/prompts/intakeAgent';

interface IntakeRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  forceRecommend?: boolean;
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
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    };
  }

  // Default: Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return {
    provider: 'anthropic',
    apiKey,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250514',
  };
}

/**
 * Stream from Anthropic API
 */
async function streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
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
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages: messages.length > 0
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: 'Hi, I want to build a habit.' }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Anthropic] API error:', response.status, error);
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
  messages: Array<{ role: string; content: string }>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages.length > 0
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [{ role: 'user', content: 'Hi, I want to build a habit.' }]),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      stream: true,
      messages: openaiMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
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
 * Streaming intake API endpoint
 * Uses Server-Sent Events to stream the response
 *
 * Configure via environment variables:
 * - AI_PROVIDER: 'anthropic' (default) or 'openai'
 * - ANTHROPIC_API_KEY / OPENAI_API_KEY
 * - ANTHROPIC_MODEL (default: claude-sonnet-4-5-20250514) / OPENAI_MODEL (default: gpt-4o)
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body: IntakeRequest = await request.json();
    const { messages, forceRecommend } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = getProviderConfig();

    // Build system prompt
    let systemPrompt = INTAKE_AGENT_SYSTEM_PROMPT;
    if (forceRecommend) {
      systemPrompt += `\n\n[SYSTEM NOTE: The user has indicated they're ready for a recommendation. Move to reflection phase immediately, then recommendation. Do not ask more discovery questions.]`;
    }

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
              messages,
              controller,
              encoder
            );
          } else {
            fullContent = await streamAnthropic(
              config.apiKey,
              config.model,
              systemPrompt,
              messages,
              controller,
              encoder
            );
          }

          // Parse the full JSON response
          console.log('[Intake] Full content received:', fullContent.substring(0, 500));
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const agentResponse = JSON.parse(jsonMatch[0]) as IntakeAgentResponse;
              if (isValidIntakeResponse(agentResponse)) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, response: agentResponse })}\n\n`)
                );
              } else {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: 'Invalid response format' })}\n\n`)
                );
              }
            } catch {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: 'Failed to parse response JSON' })}\n\n`)
              );
            }
          } else {
            console.error('[Intake] No JSON found in content:', fullContent);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'No JSON in response' })}\n\n`)
            );
          }

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
    console.error('Intake stream error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
