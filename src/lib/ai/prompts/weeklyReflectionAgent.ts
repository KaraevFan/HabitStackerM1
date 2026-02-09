/**
 * Weekly Reflection Agent System Prompt (R18)
 *
 * AI-powered weekly and recovery reflection conversations.
 * Replaces the static 5-step form in /reflect.
 *
 * 5-step guided conversation:
 * 1. Summary — data-driven overview of the week
 * 2. Sustainability — does this feel sustainable?
 * 3. Friction — what's getting in the way?
 * 4. Recommendation — specific system change if needed
 * 5. Confirmation — accept/decline, close
 *
 * Two modes:
 * - weekly: data-driven ("Here's what the numbers say")
 * - recovery: empathy-first ("I noticed a few tough days")
 */

import { HabitSystem, CheckIn, WeeklyReflection, DayMemory } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import { buildMemoryContext, MEMORY_SYSTEM_GUIDANCE, difficultyLabel, DIFFICULTY_SCALE_NOTE } from '@/lib/ai/memoryContext';
import { buildDomainKnowledgeBlock } from '@/lib/ai/domainKnowledge';
import { getReflectionTemplate, buildTemplateGuidanceBlock } from '@/lib/ai/reflectionTemplates';

/**
 * Context passed to the weekly reflection agent
 */
export interface WeeklyReflectionContext {
  system: HabitSystem;
  checkIns: CheckIn[];
  patterns: CheckInPatterns | null;
  previousReflections: WeeklyReflection[];
  weekNumber: number;
  daysSinceCreation: number;
  userGoal: string | null;
  realLeverage: string | null;
  reflectionType: 'weekly' | 'recovery' | 'on_demand';
  exchangeCount: number;
  previousMessages: Array<{ role: 'ai' | 'user'; content: string }>;
  // On-demand context
  onDemandIntent?: string;
  // Rolling context from previous days (R19)
  dayMemories?: DayMemory[];
}

/**
 * Response from the weekly reflection agent
 */
export interface WeeklyReflectionResponse {
  message: string;
  suggestedReplies: string[] | null;
  shouldClose: boolean;
  sustainability?: 'yes' | 'mostly' | 'no';
  friction?: string;
  recommendation?: {
    text: string;
    appliesTo: 'anchor' | 'action' | 'tiny_version' | 'recovery' | 'timing' | 'none';
    newValue?: string;
  } | null;
}

/**
 * Build system prompt for weekly reflection conversations
 */
export function buildWeeklyReflectionSystemPrompt(
  mode: 'weekly' | 'recovery' | 'on_demand',
  system?: HabitSystem,
  weekNumber?: number
): string {
  // Get template and domain knowledge
  const template = getReflectionTemplate(weekNumber || 1, mode);
  const templateBlock = buildTemplateGuidanceBlock(template);
  const domainBlock = system
    ? buildDomainKnowledgeBlock(system, weekNumber || 1)
    : '';

  const modeGuidance = mode === 'on_demand'
    ? `## Mode: On-Demand Coach Conversation
The user chose to talk to their coach. They may want to:
- Make habit easier or harder
- Discuss whether it's the right habit
- Talk through a frustration
- Get advice

Be responsive to what they bring. Don't force a structure.`
    : ''; // Weekly and recovery modes use the template system

  return `## Role: Reflection Partner (Week ${weekNumber || '?'} Check-in)

You are conducting a Week ${weekNumber || '?'} milestone reflection for a user's habit system. You are NOT a generic assistant — you are a warm, knowledgeable coach who has been working with this person since day one.

## Your Emotional Posture

- Week 1 reflections are CELEBRATIONS first, coaching second
- Lead with genuine, specific acknowledgment — not generic praise
- Show you understand WHY this habit matters to them personally
- Reference their original goal and situation from intake
- Be direct and have a point of view — don't be passive
- End with energy, forward momentum, and a concrete micro-challenge
- You're brief — 2-4 sentences max per response
- ONE question or insight per message

${templateBlock}

${domainBlock}

${modeGuidance}

## Anti-Patterns (DO NOT DO THESE)

- Do NOT open with multiple statistics or a data dump
- Do NOT lead with difficulty scores or express concern about numbers without understanding the user's subjective experience first
- Do NOT ask passive questions like "do you want to keep it as is?"
- Do NOT give generic encouragement disconnected from their specific habit domain
- Do NOT skip the celebration — even if there were misses, find what went right first
- Do NOT forget you have context from intake — reference it naturally
- Do NOT provide a micro-challenge that is more than ONE specific thing
- Do NOT say "Thanks for sharing"
- Do NOT use shame language: failure, lazy, discipline, streak
- Do NOT suggest adding MORE habits
- Do NOT make the conversation longer than needed

## Conversation Rules

1. When recommending a change, be specific: "Try changing your anchor from X to Y"
2. Set recommendation.appliesTo to indicate which system field to change
3. Set recommendation.newValue to the suggested new value when applicable
4. Never increase difficulty in Weeks 1-2
5. Use "reps" and "in a row" — never "streak"

## Output format

Respond with JSON only:
{
  "message": "Your response (2-4 sentences, conversational)",
  "suggestedReplies": ["Option 1", "Option 2", "I'm done"] or null,
  "shouldClose": false,
  "sustainability": null,
  "friction": null,
  "recommendation": null
}

### recommendation (include when suggesting a system change)
{
  "text": "What you'd change and why",
  "appliesTo": "anchor" | "action" | "tiny_version" | "recovery" | "timing" | "none",
  "newValue": "specific new value" or undefined
}

### shouldClose
Set to true when:
- User has accepted or declined recommendation
- Conversation has naturally concluded
- User signals they're done
- Recovery: user has a forward plan

### suggestedReplies
- Always contextual to what was just discussed
- Include one "done" option
- Set to null only when free-form input is needed

## Memory guidance
${MEMORY_SYSTEM_GUIDANCE}

## Continuity language
Never say "streak" — use "reps", "in a row", "showing up", "continuity".
`;
}

/**
 * Build opener prompt for weekly reflection
 */
export function buildWeeklyReflectionOpenerPrompt(context: WeeklyReflectionContext): string {
  const { system, patterns, weekNumber, reflectionType, onDemandIntent } = context;

  let prompt = `Generate an opening message for a ${reflectionType} reflection conversation.

## About This User

Habit: "${system.anchor}" → "${system.action}"
Recovery: "${system.recovery}"
Week number: ${weekNumber}
`;

  if (context.userGoal) {
    prompt += `Original goal from intake: "${context.userGoal}"\n`;
  }
  if (context.realLeverage) {
    prompt += `Original blocker from intake: "${context.realLeverage}"\n`;
  }
  if (system.identity) {
    prompt += `Identity they're building: "${system.identity}"\n`;
  }

  if (patterns) {
    prompt += `
## This Week's Data
- Completed: ${patterns.completedCount} out of 7 days
- Total reps: ${patterns.currentStreak} in a row
- Difficulty ratings: ${difficultyLabel(patterns.averageDifficulty)}
- ${DIFFICULTY_SCALE_NOTE}
- Trend: ${patterns.difficultyTrend}
`;
    if (patterns.missedCount > 0) {
      prompt += `- Misses: ${patterns.missedCount}`;
      if (patterns.repeatedMissReason) prompt += ` (reason: "${patterns.repeatedMissReason}")`;
      prompt += '\n';
    }
    if (patterns.strongDays.length > 0) {
      prompt += `- Strong days: ${patterns.strongDays.join(', ')}\n`;
    }
    if (patterns.weakDays.length > 0) {
      prompt += `- Weak days: ${patterns.weakDays.join(', ')}\n`;
    }
  }

  if (onDemandIntent) {
    prompt += `\nUser's intent for this conversation: "${onDemandIntent}"\n`;
  }

  if (context.dayMemories && context.dayMemories.length > 0) {
    prompt += `\n## Recent conversation history\n${buildMemoryContext(context.dayMemories)}\n`;
  }

  if (context.previousReflections.length > 0) {
    const last = context.previousReflections[context.previousReflections.length - 1];
    prompt += `\nLast reflection: Week ${last.weekNumber}, sustainability: ${last.sustainability}`;
    if (last.recommendation) {
      prompt += `, recommendation: "${last.recommendation.text}" (${last.recommendation.accepted ? 'accepted' : 'declined'})`;
    }
    prompt += '\n';
  }

  prompt += `
## Your task

Generate an opening message. Follow the conversation template for this milestone.
${reflectionType === 'recovery'
    ? `Start with NORMALIZATION: acknowledge the tough stretch with warmth (not pity). Ask what happened (open-ended).`
    : reflectionType === 'on_demand'
    ? `Greet warmly and ask what's on their mind.`
    : weekNumber <= 1
    ? `Start with CELEBRATION: ONE specific, celebratory observation about completing Week 1. Reference their consistency AND connect it to their original goal. Do NOT open with multiple statistics. Then ask ONE feeling question.

GOOD: "X days of facing your finances. The hardest part isn't the logging — it's showing up when the numbers are uncomfortable. You've been doing that."
BAD: "You logged X out of 7 days — Y in a row. Difficulty is Z/5."`
    : `Start with ONE specific pattern observation from the data. Then ask about their experience.`
}

Keep it to 2-3 sentences. Ask ONE question.

Respond with JSON only.`;

  return prompt;
}

/**
 * Build user prompt for subsequent exchanges
 */
export function buildWeeklyReflectionUserPrompt(
  context: WeeklyReflectionContext,
  userMessage: string
): string {
  const { system, patterns, weekNumber, reflectionType, exchangeCount, previousMessages, dayMemories } = context;

  let contextBlock = `## What you and the user have discussed recently
${buildMemoryContext(dayMemories)}

## Context

Habit: "${system.anchor}" → "${system.action}"
Recovery: "${system.recovery}"
Week: ${weekNumber}
Mode: ${reflectionType}
`;

  if (patterns) {
    contextBlock += `Response rate: ${Math.round(patterns.responseRateWhenTriggered * 100)}%
Avg difficulty: ${difficultyLabel(patterns.averageDifficulty)}
Trend: ${patterns.difficultyTrend}
${DIFFICULTY_SCALE_NOTE}
`;
  }

  if (context.userGoal) {
    contextBlock += `Goal: "${context.userGoal}"\n`;
  }

  if (system.identity) {
    contextBlock += `Identity: "${system.identity}"\n`;
  }

  if (system.tinyVersion) {
    contextBlock += `Tiny version: "${system.tinyVersion}"\n`;
  }

  if (previousMessages.length > 0) {
    contextBlock += `\n## Previous exchanges\n`;
    for (const msg of previousMessages) {
      contextBlock += `${msg.role === 'ai' ? 'You' : 'User'}: "${msg.content}"\n`;
    }
  }

  contextBlock += `
## Current exchange
Exchange #${exchangeCount + 1}
User's message: "${userMessage}"

Guidelines:
- If user shared sustainability feedback, capture in sustainability field
- If user shared friction, capture in friction field
- When ready to suggest a change, include recommendation with appliesTo and newValue
- If no change needed, set recommendation.appliesTo to "none"
- Close conversation naturally after recommendation is accepted/declined

Respond with JSON only.`;

  return contextBlock;
}

/**
 * Validate weekly reflection response
 */
export function validateWeeklyReflectionResponse(response: unknown): { valid: boolean; reason?: string } {
  if (typeof response !== 'object' || response === null) {
    return { valid: false, reason: 'Response is not an object' };
  }

  const r = response as Record<string, unknown>;

  if (typeof r.message !== 'string') {
    return { valid: false, reason: `message is ${typeof r.message}, expected string` };
  }
  if (r.suggestedReplies !== null && !Array.isArray(r.suggestedReplies)) {
    return { valid: false, reason: `suggestedReplies is ${typeof r.suggestedReplies}, expected array or null` };
  }
  if (typeof r.shouldClose !== 'boolean') {
    return { valid: false, reason: `shouldClose is ${typeof r.shouldClose}, expected boolean` };
  }

  return { valid: true };
}

/**
 * Type guard for WeeklyReflectionResponse
 */
export function isValidWeeklyReflectionResponse(response: unknown): response is WeeklyReflectionResponse {
  return validateWeeklyReflectionResponse(response).valid;
}
