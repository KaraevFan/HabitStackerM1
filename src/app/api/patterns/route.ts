import { NextRequest } from 'next/server';
import {
  buildPatternAgentSystemPrompt,
  buildPatternAgentPrompt,
  PatternAgentContext,
  validatePatternAgentResponse,
} from '@/lib/ai/prompts/patternAgent';

type AIProvider = 'anthropic' | 'openai';

function getProviderConfig(): { provider: AIProvider; apiKey: string; model: string } {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider;

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    return { provider: 'openai', apiKey, model: process.env.OPENAI_PATTERN_MODEL || 'gpt-4o' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return { provider: 'anthropic', apiKey, model: process.env.ANTHROPIC_PATTERN_MODEL || 'claude-sonnet-4-5-20250929' };
}

async function callAI(config: { provider: AIProvider; apiKey: string; model: string }, systemPrompt: string, userPrompt: string): Promise<string> {
  if (config.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, max_tokens: 1024, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }),
    });
    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: config.model, max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
  });
  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  try {
    const context: PatternAgentContext = await request.json();
    const config = getProviderConfig();
    const systemPrompt = buildPatternAgentSystemPrompt();
    const userPrompt = buildPatternAgentPrompt(context);
    const content = await callAI(config, systemPrompt, userPrompt);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No JSON in response' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validation = validatePatternAgentResponse(parsed);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.reason }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[Patterns] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
