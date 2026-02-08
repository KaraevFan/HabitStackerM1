import { NextRequest } from 'next/server';
import { DayMemory } from '@/types/habit';

interface ExtractMemoryRequest {
  messages: Array<{ role: 'ai' | 'user'; content: string }>;
  date: string;
  outcome: 'completed' | 'missed' | 'recovered' | 'skipped';
}

/**
 * POST /api/extract-memory
 *
 * Extracts a structured DayMemory from conversation messages.
 * Uses Haiku for speed and cost efficiency.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExtractMemoryRequest = await request.json();
    const { messages, date, outcome } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    const conversationText = messages
      .map(m => `${m.role === 'ai' ? 'Coach' : 'User'}: ${m.content}`)
      .join('\n');

    const extractionPrompt = `You are summarizing a brief coaching conversation for future reference.
Extract these fields as JSON:

- userShared: 1-2 sentences capturing the KEY thing the user expressed (feelings, context, struggles). Use their language where possible.
- frictionNote: If they mentioned something hard or a barrier, capture it here. null if none.
- winNote: If they mentioned something that worked or felt good, capture it here. null if none.
- coachObservation: 1 sentence — what you (the coach) noticed, recommended, or acknowledged.
- emotionalTone: One word for the user's emotional state (e.g., "frustrated", "proud", "tired", "neutral").

Be specific, not generic. "Partner stays up late watching TV making wind-down hard" is good. "Had some challenges" is bad.

Conversation:
${conversationText}

Respond with JSON only. No markdown, no explanation.`;

    const provider = (process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openai';

    let rawResponse: string;

    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MEMORY_MODEL || 'gpt-4o-mini',
          max_tokens: 512,
          messages: [
            { role: 'system', content: 'You extract structured summaries from coaching conversations. Respond with JSON only.' },
            { role: 'user', content: extractionPrompt },
          ],
        }),
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const data = await response.json();
      rawResponse = data.choices?.[0]?.message?.content || '';
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MEMORY_MODEL || 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: 'You extract structured summaries from coaching conversations. Respond with JSON only.',
          messages: [{ role: 'user', content: extractionPrompt }],
        }),
      });

      if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
      const data = await response.json();
      rawResponse = data.content?.[0]?.text || '';
    }

    // Parse JSON from response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    const memory: DayMemory = {
      date,
      outcome,
      userShared: extracted.userShared || 'No details shared.',
      frictionNote: extracted.frictionNote || undefined,
      winNote: extracted.winNote || undefined,
      coachObservation: extracted.coachObservation || 'Conversation logged.',
      emotionalTone: extracted.emotionalTone || 'neutral',
    };

    return Response.json(memory);
  } catch (error) {
    console.error('[extract-memory] Error:', error);
    return Response.json(
      { error: 'Failed to extract memory' },
      { status: 500 }
    );
  }
}
