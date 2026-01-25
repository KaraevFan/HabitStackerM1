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

/**
 * Streaming intake API endpoint
 * Uses Server-Sent Events to stream the response
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    let systemPrompt = INTAKE_AGENT_SYSTEM_PROMPT;
    if (forceRecommend) {
      systemPrompt += `\n\n[SYSTEM NOTE: The user has indicated they're ready for a recommendation. Move to reflection phase immediately, then recommendation. Do not ask more discovery questions.]`;
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
              stream: true,
              system: systemPrompt,
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
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: `API error: ${response.status}` })}\n\n`)
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`)
            );
            controller.close();
            return;
          }

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

                  // Handle content block delta
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullContent += parsed.delta.text;
                    // Send chunk to client
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ chunk: parsed.delta.text })}\n\n`)
                    );
                  }

                  // Handle message stop
                  if (parsed.type === 'message_stop') {
                    // Parse the full JSON response
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
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: 'No JSON in response' })}\n\n`)
                      );
                    }
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
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
