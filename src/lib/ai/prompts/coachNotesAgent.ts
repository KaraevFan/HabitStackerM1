/**
 * Coach's Notes Agent (R18)
 * Generates personalized coaching notes from intake transcript and updates after reflections
 */

import { HabitSystem, CoachNotes } from '@/types/habit';

export interface CoachNotesGenerateContext {
  mode: 'generate';
  system: HabitSystem;
  intakeTranscript: Array<{ role: string; content: string }>;
  userGoal?: string | null;
  realLeverage?: string | null;
}

export interface CoachNotesUpdateContext {
  mode: 'update';
  existingNotes: CoachNotes;
  reflectionData: {
    type: string;
    sustainability: string | null;
    friction: string | null;
    recommendation: { text: string; accepted: boolean } | null;
  };
}

export function buildCoachNotesGeneratePrompt(context: CoachNotesGenerateContext): string {
  return `You are the Habit Stacker Coach. Generate personalized coaching notes for this user based on their intake conversation.

## User's Habit System
Anchor: "${context.system.anchor}"
Action: "${context.system.action}"
Recovery: "${context.system.recovery}"
Identity: "${context.system.identity || 'not set'}"
${context.userGoal ? `Goal: "${context.userGoal}"` : ''}
${context.realLeverage ? `Key insight: "${context.realLeverage}"` : ''}

## Intake Conversation
${context.intakeTranscript.map(m => `${m.role}: ${m.content}`).join('\n').slice(0, 3000)}

## Generate these 5 sections (each 2-3 sentences, conversational tone):

1. **patternNoticed**: A behavioral pattern you noticed in the conversation (not just restating their problem)
2. **whyThisHabit**: Why this specific habit addresses their real blocker (connect the dots)
3. **scienceIn60Seconds**: The behavioral science principle at work (accessible, not academic)
4. **whatToWatchFor**: What could go wrong and early warning signs
5. **yourEdge**: What advantage they have that others don't (something specific from their situation)

Respond with JSON only:
{
  "patternNoticed": "...",
  "whyThisHabit": "...",
  "scienceIn60Seconds": "...",
  "whatToWatchFor": "...",
  "yourEdge": "..."
}`;
}

export function buildCoachNotesUpdatePrompt(context: CoachNotesUpdateContext): string {
  return `Based on a ${context.reflectionData.type} reflection, generate a brief addendum for the coach's notes.

Reflection data:
- Sustainability: ${context.reflectionData.sustainability || 'not answered'}
- Friction: ${context.reflectionData.friction || 'none mentioned'}
- Recommendation: ${context.reflectionData.recommendation ? `"${context.reflectionData.recommendation.text}" (${context.reflectionData.recommendation.accepted ? 'accepted' : 'declined'})` : 'none'}

Existing notes summary:
- Pattern: "${context.existingNotes.patternNoticed}"
- Watch for: "${context.existingNotes.whatToWatchFor}"

Generate a 1-2 sentence addendum that updates the coaching picture. Focus on new information, not repeating existing notes.

Respond with JSON only:
{ "content": "The addendum text" }`;
}

export function validateCoachNotesResponse(response: unknown): boolean {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as Record<string, unknown>;
  return (
    typeof r.patternNoticed === 'string' &&
    typeof r.whyThisHabit === 'string' &&
    typeof r.scienceIn60Seconds === 'string' &&
    typeof r.whatToWatchFor === 'string' &&
    typeof r.yourEdge === 'string'
  );
}
