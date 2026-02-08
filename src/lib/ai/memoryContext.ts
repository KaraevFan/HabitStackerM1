import { DayMemory } from '@/types/habit';

/**
 * Build a context string from recent DayMemory entries.
 * Used to give AI agents continuity across daily conversations.
 */
export function buildMemoryContext(dayMemories: DayMemory[] | undefined, count: number = 7): string {
  if (!dayMemories || dayMemories.length === 0) {
    return 'No previous conversation history yet.';
  }

  const recent = dayMemories.slice(-count);

  const lines = recent.map(m => {
    let line = `- ${m.date} (${m.outcome}): ${m.userShared}`;
    if (m.frictionNote) line += ` Friction: ${m.frictionNote}.`;
    if (m.winNote) line += ` Win: ${m.winNote}.`;
    line += ` You noted: ${m.coachObservation}`;
    if (m.emotionalTone && m.emotionalTone !== 'neutral') line += ` [tone: ${m.emotionalTone}]`;
    return line;
  });

  return lines.join('\n');
}

/**
 * Memory guidance to add to each AI agent's system prompt.
 */
export const MEMORY_SYSTEM_GUIDANCE = `
You have context from previous conversations with this user. Use it naturally:
- Reference specific things they've shared before ("Last time you mentioned X...")
- Don't re-ask questions they've already answered
- Notice patterns in their emotional state across days
- If they mentioned a barrier before and seem to have overcome it, acknowledge growth
- If the same friction keeps appearing, name it directly

Never say "based on our previous conversations" or "according to my notes" —
just naturally incorporate what you know, like a coach who remembers their client.
`;
