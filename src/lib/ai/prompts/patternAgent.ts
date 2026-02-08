/**
 * Pattern Agent (R18)
 * AI-powered pattern analysis for deeper insights than rule-based system
 */

import { HabitSystem, CheckIn, PatternSnapshot, WeeklyReflection } from '@/types/habit';

export interface PatternAgentContext {
  system: HabitSystem;
  checkIns: CheckIn[];
  previousSnapshot: PatternSnapshot | null;
  reflections: WeeklyReflection[];
  weekNumber: number;
}

export interface PatternAgentResponse {
  insights: Array<{
    type: 'positive' | 'neutral' | 'warning';
    content: string;
  }>;
  suggestion: {
    content: string;
    actionType: 'anchor' | 'tiny_version' | 'environment' | 'timing' | 'general';
    appliesTo: 'anchor' | 'action' | 'tiny_version' | 'recovery' | 'timing' | 'none';
    newValue?: string;
  } | null;
}

export function buildPatternAgentSystemPrompt(): string {
  return `You are the Habit Stacker Pattern Analyzer. You analyze check-in data to find patterns and generate insights.

## Rules
- Generate max 3 insights: at least 1 positive, at most 1 warning
- Generate at most 1 suggestion with a specific actionType
- Never suggest adding more habits
- Never increase difficulty in Weeks 1-2
- Reference specific data points (days, percentages, numbers)
- Keep insights to 1 sentence each
- Use "reps" and "in a row" — never "streak"

## Output format
{
  "insights": [
    { "type": "positive" | "neutral" | "warning", "content": "One sentence insight" }
  ],
  "suggestion": {
    "content": "What to change and why",
    "actionType": "anchor" | "tiny_version" | "environment" | "timing" | "general",
    "appliesTo": "anchor" | "action" | "tiny_version" | "recovery" | "timing" | "none",
    "newValue": "specific new value if applicable"
  } | null
}

Respond with JSON only.`;
}

export function buildPatternAgentPrompt(context: PatternAgentContext): string {
  const { system, checkIns, previousSnapshot, weekNumber } = context;

  const last14 = checkIns
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14);

  const completed = last14.filter(c => c.triggerOccurred && c.actionTaken).length;
  const missed = last14.filter(c => c.triggerOccurred && !c.actionTaken).length;
  const total = last14.length;

  let prompt = `Analyze these check-ins and generate insights.

## Habit
Anchor: "${system.anchor}"
Action: "${system.action}"
Recovery: "${system.recovery}"
Week: ${weekNumber}

## Last ${total} check-ins
Completed: ${completed}, Missed: ${missed}
Response rate: ${total > 0 ? Math.round((completed / total) * 100) : 0}%
`;

  // Add difficulty data
  const withDiff = last14.filter(c => c.difficultyRating);
  if (withDiff.length > 0) {
    const avgDiff = withDiff.reduce((sum, c) => sum + (c.difficultyRating || 3), 0) / withDiff.length;
    prompt += `Avg difficulty: ${avgDiff.toFixed(1)}/5\n`;
  }

  // Day-of-week breakdown
  const dayStats: Record<string, { done: number; missed: number }> = {};
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const c of last14) {
    const day = days[new Date(c.date).getDay()];
    if (!dayStats[day]) dayStats[day] = { done: 0, missed: 0 };
    if (c.actionTaken) dayStats[day].done++;
    else if (c.triggerOccurred) dayStats[day].missed++;
  }
  prompt += `\nDay breakdown:\n`;
  for (const [day, s] of Object.entries(dayStats)) {
    prompt += `  ${day}: ${s.done} done, ${s.missed} missed\n`;
  }

  // Miss reasons
  const reasons = last14.filter(c => c.missReason).map(c => c.missReason);
  if (reasons.length > 0) {
    prompt += `\nMiss reasons: ${reasons.join(', ')}\n`;
  }

  // Previous snapshot
  if (previousSnapshot) {
    prompt += `\nPrevious analysis (${previousSnapshot.generatedAt.split('T')[0]}):\n`;
    for (const i of previousSnapshot.insights) {
      prompt += `  - [${i.type}] ${i.content}\n`;
    }
  }

  if (system.tinyVersion) {
    prompt += `\nTiny version: "${system.tinyVersion}"\n`;
  }

  prompt += `\nRespond with JSON only.`;

  return prompt;
}

export function validatePatternAgentResponse(response: unknown): { valid: boolean; reason?: string } {
  if (typeof response !== 'object' || response === null) {
    return { valid: false, reason: 'Not an object' };
  }
  const r = response as Record<string, unknown>;
  if (!Array.isArray(r.insights)) {
    return { valid: false, reason: 'insights must be an array' };
  }
  return { valid: true };
}
