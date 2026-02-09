import { DayMemory } from '@/types/habit';

/**
 * Translate a numeric difficulty rating to a natural-language label.
 * Scale: 1 = Hard, 5 = Easy. Never show raw numbers to the AI.
 */
export function difficultyLabel(rating: number): string {
  if (rating <= 1.5) return 'Hard (1/5)';
  if (rating <= 2.5) return 'Somewhat hard (2/5)';
  if (rating <= 3.5) return 'OK (3/5)';
  if (rating <= 4.5) return 'Fairly easy (4/5)';
  return 'Easy (5/5)';
}

/**
 * Difficulty scale explanation to inject into AI prompts.
 */
export const DIFFICULTY_SCALE_NOTE = 'Difficulty scale: 1 = Hard, 5 = Easy. Higher numbers mean easier.';

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
