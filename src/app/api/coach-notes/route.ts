import { NextRequest } from 'next/server';
import {
  buildCoachNotesGeneratePrompt,
  buildCoachNotesUpdatePrompt,
  CoachNotesGenerateContext,
  CoachNotesUpdateContext,
  validateCoachNotesResponse,
} from '@/lib/ai/prompts/coachNotesAgent';

type AIProvider = 'anthropic' | 'openai';

function getProviderConfig(): { provider: AIProvider; apiKey: string; model: string } {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return { provider: 'openai', apiKey, model: 'gpt-4o' };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return { provider: 'anthropic', apiKey, model: 'claude-sonnet-4-5-20250929' };
}

async function callAI(
  config: { provider: AIProvider; apiKey: string; model: string },
  prompt: string
): Promise<string> {
  if (config.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = getProviderConfig();

    if (body.mode === 'update') {
      const context: CoachNotesUpdateContext = body;
      const prompt = buildCoachNotesUpdatePrompt(context);
      const content = await callAI(config, prompt);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: 'No JSON' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ addendum: parsed.content || parsed }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate mode
    const context: CoachNotesGenerateContext = body;
    const prompt = buildCoachNotesGeneratePrompt(context);
    const content = await callAI(config, prompt);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No JSON' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!validateCoachNotesResponse(parsed)) {
      return new Response(JSON.stringify({ error: 'Invalid response shape' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ coachNotes: { ...parsed, addenda: [] } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CoachNotes] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
