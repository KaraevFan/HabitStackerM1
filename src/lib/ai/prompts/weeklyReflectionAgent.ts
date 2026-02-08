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

import { HabitSystem, CheckIn, WeeklyReflection } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';

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
export function buildWeeklyReflectionSystemPrompt(mode: 'weekly' | 'recovery' | 'on_demand'): string {
  const modeGuidance = mode === 'recovery'
    ? `## Mode: Recovery Reflection
You noticed the user has had 3+ consecutive misses. Lead with empathy, not data.

Tone:
- "I noticed a few tough days. That's information, not failure."
- Never shame or guilt. Misses are data about the system, not the person.
- Possible outcomes: adjust system, try tiny version, pause habit, redesign, recommit as-is

Recovery-specific flow:
1. Acknowledge the tough stretch with warmth
2. Ask what happened (open-ended)
3. Probe if the system itself needs change
4. Offer specific adjustment OR validate recommitting as-is
5. Close with a specific forward plan`
    : mode === 'on_demand'
    ? `## Mode: On-Demand Coach Conversation
The user chose to talk to their coach. They may want to:
- Make habit easier or harder
- Discuss whether it's the right habit
- Talk through a frustration
- Get advice

Be responsive to what they bring. Don't force a structure.`
    : `## Mode: Weekly Reflection
Data-driven conversation. "Here's what the numbers say."

Weekly-specific flow:
1. Present key stats (completion rate, difficulty trend, strong/weak days)
2. Ask about sustainability
3. Probe friction if any
4. Recommend specific system change OR validate status quo
5. Close with next week's focus`;

  return `You are the Habit Stacker AI in "Weekly Reflection" mode. You're having a guided conversation to review how the habit system is working and whether it needs adjustment.

## Your personality
- Data-informed but warm — like a thoughtful coach reviewing film
- You notice patterns and connect them to specific observations
- You never lecture or moralize
- You're brief — 2-4 sentences max per response

${modeGuidance}

## Conversation rules

1. ONE question or insight per message
2. Reference specific data points (days, percentages, patterns)
3. When recommending a change, be specific: "Try changing your anchor from X to Y"
4. Set recommendation.appliesTo to indicate which system field to change
5. Set recommendation.newValue to the suggested new value when applicable
6. Never suggest adding MORE habits
7. Never increase difficulty in Weeks 1-2
8. Use "reps" and "in a row" — never "streak"

## DO NOT
- Say "Thanks for sharing"
- Use shame language: failure, lazy, discipline
- Suggest adding habits
- Make the conversation longer than needed
- Give generic advice that could apply to anyone

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

## Context

Habit: "${system.anchor}" → "${system.action}"
Recovery: "${system.recovery}"
Week number: ${weekNumber}
Reflection type: ${reflectionType}
`;

  if (patterns) {
    prompt += `
Stats (last 7 days):
- Completed: ${patterns.completedCount}
- Missed: ${patterns.missedCount}
- Response rate: ${Math.round(patterns.responseRateWhenTriggered * 100)}%
- Average difficulty: ${patterns.averageDifficulty.toFixed(1)}/5
- Difficulty trend: ${patterns.difficultyTrend}
- Current run: ${patterns.currentStreak} in a row
`;

    if (patterns.strongDays.length > 0) {
      prompt += `- Strong days: ${patterns.strongDays.join(', ')}\n`;
    }
    if (patterns.weakDays.length > 0) {
      prompt += `- Weak days: ${patterns.weakDays.join(', ')}\n`;
    }
    if (patterns.repeatedMissReason) {
      prompt += `- Repeated miss reason: "${patterns.repeatedMissReason}"\n`;
    }
  }

  if (context.userGoal) {
    prompt += `User's original goal: "${context.userGoal}"\n`;
  }

  if (system.identity) {
    prompt += `Identity: "${system.identity}"\n`;
  }

  if (onDemandIntent) {
    prompt += `\nUser's intent for this conversation: "${onDemandIntent}"\n`;
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

Generate an opening message that:
${reflectionType === 'recovery'
    ? `1. Acknowledges the tough stretch with warmth (not pity)
2. Normalizes misses as data, not failure
3. Asks what happened (open-ended)`
    : reflectionType === 'on_demand'
    ? `1. Greets warmly and acknowledges they want to talk
2. Asks about their intent or what's on their mind`
    : `1. Presents 1-2 key data points about the week
2. Frames the conversation ("Let's see if anything needs adjusting")
3. Asks about sustainability`
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
  const { system, patterns, weekNumber, reflectionType, exchangeCount, previousMessages } = context;

  let contextBlock = `## Context

Habit: "${system.anchor}" → "${system.action}"
Recovery: "${system.recovery}"
Week: ${weekNumber}
Mode: ${reflectionType}
`;

  if (patterns) {
    contextBlock += `Response rate: ${Math.round(patterns.responseRateWhenTriggered * 100)}%
Avg difficulty: ${patterns.averageDifficulty.toFixed(1)}/5
Trend: ${patterns.difficultyTrend}
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
