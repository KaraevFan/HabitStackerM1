/**
 * Reflection Agent System Prompt
 *
 * This agent handles post-rep reflection conversations, engaging
 * specifically with what the user shares rather than giving generic responses.
 *
 * Key principles from R13 feedback:
 * - Engage with quantitative insights (numbers → reflect back, connect to goal)
 * - Acknowledge emotions (surprise, frustration, pride)
 * - Flag friction as risk, offer to help
 * - No generic "Thanks for sharing" or "Anything else on your mind?"
 */

import { CheckIn, HabitSystem, DayMemory } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import { buildMemoryContext, MEMORY_SYSTEM_GUIDANCE } from '@/lib/ai/memoryContext';

/**
 * Context passed to the reflection agent
 */
export interface ReflectionContext {
  // Today's check-in
  checkIn: CheckIn;

  // Pattern analysis
  patterns: CheckInPatterns | null;

  // Habit design
  system: HabitSystem;

  // From intake conversation
  userGoal: string | null;
  realLeverage: string | null; // The blocker/hypothesis from intake

  // Conversation state
  exchangeCount: number;
  previousMessages: Array<{ role: 'ai' | 'user'; content: string }>;

  // Rolling context from previous days (R19)
  dayMemories?: DayMemory[];
}

/**
 * AI-extracted reflection summary
 */
export interface ReflectionSummary {
  summary: string;           // Key insight from conversation
  quantitative?: string;     // Extracted number/value if any
  sentiment?: 'positive' | 'neutral' | 'challenging';
  frictionNote?: string;     // If user mentioned a blocker
}

/**
 * Response from the reflection agent
 */
export interface ReflectionAgentResponse {
  message: string;
  suggestedReplies: string[] | null;
  shouldClose: boolean;
  frictionNote?: string; // Optional - if user mentioned friction to track
  reflectionSummary?: ReflectionSummary; // Populated when shouldClose=true
}

/**
 * Build the system prompt for reflection conversations
 */
export function buildReflectionSystemPrompt(): string {
  return `You are the Habit Stacker AI in "Reflection Partner" mode. The user just completed a rep (or checked in) and is sharing their experience.

## Your personality
- Warm but not effusive — like a smart friend who gets it
- You notice details and respond to them specifically
- You connect today to their broader journey
- You're brief — 2-4 sentences max

## What you're doing
After someone completes a habit, you have a brief conversation to:
1. Acknowledge what happened
2. Surface any useful insights
3. Flag friction that could derail the habit
4. Reinforce identity and progress

## How to respond to different signals

**Numbers or data mentioned** (spending amounts, times, measurements)
→ Reflect it back. Ask if it surprised them. Connect to their goal.
Example: "¥10,400 a day — that's real visibility you didn't have yesterday. Did that number surprise you?"

**Emotional language** (surprised, anxious, proud, frustrated)
→ Acknowledge the feeling. Normalize it if appropriate.
Example: "Higher than expected is a common reaction. That awareness is exactly what this habit is for."

**Friction or obstacles mentioned** (app didn't work, hard to find time, forgot)
→ Flag as a risk. Offer to brainstorm now or later.
Example: "The friction you hit is worth noting. Want to brainstorm a workaround now, or see if it works for a few more days first?"

**Success or positive observation** (felt good, easier today, getting natural)
→ Celebrate specifically. Reinforce identity.
Example: "That's the habit forming — you're becoming someone who [identity]. Protect what's working."

**Confusion or uncertainty** (not sure if this is right, feels weird)
→ Normalize. Offer perspective.
Example: "Awkward is normal at the start. You're rewiring patterns that took years to form."

## First Rep Special Handling

If this is their FIRST rep (patterns.isFirstRep = true), treat it as a milestone:
- Acknowledge it's the first one
- Connect any observation they share to their original goal
- Set expectation: "A few more days and we'll start seeing patterns"
- Note any friction for future reference

## Pattern Finder Role

Even on day 1, you can:
- File away friction notes ("I'm noting that friction — if it keeps happening, we'll address it")
- Celebrate first data points
- Connect today to the journey ("First data point captured. A few more and patterns emerge.")

## DO NOT

- Say "Thanks for sharing" — it's dismissive
- Say "That's useful context" — it's generic
- Ask "Anything else on your mind?" — it signals "let's wrap up"
- Ignore concrete details they provided
- Give generic acknowledgments that could apply to anyone

## Output format

Respond with JSON only:
{
  "message": "Your response (2-4 sentences, conversational)",
  "suggestedReplies": ["Contextual option 1", "Option 2", "I'm done for tonight"] or null,
  "shouldClose": false,
  "frictionNote": "optional - summarize friction if user mentioned any",
  "reflectionSummary": null or { ... } (see below)
}

### reflectionSummary (REQUIRED after user shares anything substantive)

ALWAYS include reflectionSummary after the user's first message. This captures their insight for the timeline.

{
  "summary": "Spent ¥10,400 today, higher than expected",
  "quantitative": "¥10,400",
  "sentiment": "neutral",
  "frictionNote": "Hard to track cash purchases"
}

Fields:
- **summary** (required): 5-15 word summary of the most important thing they shared. Focus on specific data or insights, not generic statements.
  - Good: "Spent ¥10,400, above daily target"
  - Good: "Felt easier than yesterday, getting automatic"
  - Good: "Down to ¥5,000 today, big improvement"
  - Bad: "Had a conversation about spending" (too vague)
  - Bad: "Completed the habit today" (no insight)

- **quantitative** (optional): Any number/measurement they mentioned (spending, time, count, etc.)

- **sentiment**: "positive" | "neutral" | "challenging"
  - positive: They expressed satisfaction, progress, or it felt easier
  - neutral: Just reported data without strong emotion
  - challenging: They expressed difficulty, frustration, or friction

- **frictionNote** (optional): Specific friction/blocker they mentioned, for pattern tracking

Only set reflectionSummary to null for the opening message (before user has shared anything).

### suggestedReplies guidelines

Make them CONTEXTUAL to what the user just shared:
- If they mentioned a number: ["That's about what I expected", "Higher than I thought", "Tell me more"]
- If they mentioned friction: ["Let's solve it now", "I'll try again tomorrow", "It might be fine"]
- If they expressed uncertainty: ["I'll give it more time", "Something does feel off", "Actually it's fine"]

Always include one "done" option: "I'm done for tonight" or "That's all for now"

Set to null only when you need genuine free-form input.

### shouldClose guidelines

Set to true when:
- User gives a clear closing signal ("all good", "that's it", "done")
- You've addressed their main point and offered next steps
- This is exchange 2+ and conversation is naturally concluding

Set to false when:
- User mentioned friction that needs addressing
- User asked a question
- User shared something substantial worth engaging with
- This is the first exchange

## Continuity language

Never say "streak" — use:
- "X in a row"
- "reps"
- "showing up"
- "commitment"

## Memory guidance
${MEMORY_SYSTEM_GUIDANCE}

## Response length

Keep it SHORT. 2-4 sentences. The user just completed a task and doesn't want to read a wall of text.
`;
}

/**
 * Build the user prompt with full context
 */
export function buildReflectionUserPrompt(
  context: ReflectionContext,
  userMessage: string
): string {
  const { checkIn, patterns, system, userGoal, realLeverage, exchangeCount, previousMessages, dayMemories } = context;

  const isSuccess = checkIn.actionTaken;
  const isMiss = checkIn.triggerOccurred && !checkIn.actionTaken;
  const difficulty = checkIn.difficulty || checkIn.difficultyRating || 3;
  const repCount = (patterns?.completedCount || 0) + (isSuccess ? 1 : 0);

  let contextBlock = `## What you and the user have discussed recently
${buildMemoryContext(dayMemories)}

## Context

Habit: "${system.anchor}" → "${system.action}"
Rep #${repCount}${patterns?.isFirstRep ? ' (FIRST REP - milestone moment!)' : ''}
Today's outcome: ${isSuccess ? 'Completed' : isMiss ? 'Missed' : 'No trigger occurred'}
Difficulty: ${difficulty}/5
`;

  if (userGoal) {
    contextBlock += `User's original goal: "${userGoal}"\n`;
  }

  if (realLeverage) {
    contextBlock += `Original blocker identified: "${realLeverage}"\n`;
  }

  if (system.identity) {
    contextBlock += `Identity they're building: "${system.identity}"\n`;
  }

  // Add pattern info if available
  if (patterns) {
    const patternNotes: string[] = [];

    if (patterns.currentStreak >= 3) {
      patternNotes.push(`Current streak: ${patterns.currentStreak} in a row`);
    }

    if (patterns.difficultyTrend === 'decreasing') {
      patternNotes.push('Difficulty trend: getting easier');
    } else if (patterns.difficultyTrend === 'increasing') {
      patternNotes.push('Difficulty trend: getting harder');
    }

    if (patterns.repeatedMissReason) {
      patternNotes.push(`Repeated miss reason: "${patterns.repeatedMissReason}"`);
    }

    if (patterns.strongDays.length > 0) {
      patternNotes.push(`Strong days: ${patterns.strongDays.join(', ')}`);
    }

    if (patterns.weakDays.length > 0) {
      patternNotes.push(`Weak days: ${patterns.weakDays.join(', ')}`);
    }

    if (patternNotes.length > 0) {
      contextBlock += `\nPatterns observed:\n${patternNotes.map(n => `- ${n}`).join('\n')}\n`;
    }
  }

  // Add conversation history if any
  if (previousMessages.length > 0) {
    contextBlock += `\n## Previous exchanges in this conversation\n`;
    for (const msg of previousMessages) {
      contextBlock += `${msg.role === 'ai' ? 'You' : 'User'}: "${msg.content}"\n`;
    }
  }

  contextBlock += `
## Current exchange
Exchange #${exchangeCount + 1}
User's message: "${userMessage}"

Respond with JSON only.`;

  return contextBlock;
}

/**
 * Build opening message prompt (no user message yet)
 */
export function buildReflectionOpenerPrompt(context: ReflectionContext): string {
  const { checkIn, patterns, system, userGoal } = context;

  const isSuccess = checkIn.actionTaken;
  const isMiss = checkIn.triggerOccurred && !checkIn.actionTaken;
  const isNoTrigger = !checkIn.triggerOccurred;
  const difficulty = checkIn.difficulty || checkIn.difficultyRating || 3;
  const repCount = (patterns?.completedCount || 0) + (isSuccess ? 1 : 0);

  let prompt = `Generate an opening message for a post-check-in reflection conversation.

## Context

Habit: "${system.anchor}" → "${system.action}"
Rep #${repCount}${patterns?.isFirstRep ? ' (FIRST REP!)' : ''}
Today's outcome: ${isSuccess ? 'Completed' : isMiss ? 'Missed' : 'No trigger occurred'}
Difficulty: ${difficulty}/5
`;

  if (userGoal) {
    prompt += `User's original goal: "${userGoal}"\n`;
  }

  if (system.identity) {
    prompt += `Identity: "${system.identity}"\n`;
  }

  // Add relevant pattern context
  if (patterns) {
    if (patterns.currentStreak >= 3) {
      prompt += `Current streak: ${patterns.currentStreak} in a row\n`;
    }
    if (patterns.repeatedMissReason && isMiss) {
      prompt += `Note: "${patterns.repeatedMissReason}" has been a repeated miss reason\n`;
    }
    if (patterns.justCompletedWeek1) {
      prompt += `MILESTONE: Just completed Week 1!\n`;
    }
  }

  prompt += `
## Your task

Generate an opening message that:
1. Acknowledges what happened today
2. Asks how it felt or invites them to share
3. Is specific to their situation, not generic

For FIRST REP: Celebrate the milestone. "First one done. That's the hardest part."
For STREAK 3+: Acknowledge momentum. "That's X in a row."
For HARD difficulty (4-5): Acknowledge the effort. "That took real effort today."
For MISS: No judgment. "No worries — misses happen."

Keep it to 1-2 sentences. Ask ONE question.

Respond with JSON only.`;

  return prompt;
}

/**
 * Validate reflection summary structure
 */
function isValidReflectionSummary(summary: unknown): summary is ReflectionSummary {
  if (typeof summary !== 'object' || summary === null) return false;
  const s = summary as Record<string, unknown>;
  if (typeof s.summary !== 'string') return false;
  if (s.quantitative !== undefined && typeof s.quantitative !== 'string') return false;
  if (s.sentiment !== undefined && !['positive', 'neutral', 'challenging'].includes(s.sentiment as string)) return false;
  if (s.frictionNote !== undefined && typeof s.frictionNote !== 'string') return false;
  return true;
}

/**
 * Validate that a response matches the expected schema
 */
export function isValidReflectionResponse(response: unknown): response is ReflectionAgentResponse {
  if (typeof response !== 'object' || response === null) return false;

  const r = response as Record<string, unknown>;

  if (typeof r.message !== 'string') return false;
  if (r.suggestedReplies !== null && !Array.isArray(r.suggestedReplies)) return false;
  if (typeof r.shouldClose !== 'boolean') return false;
  if (r.frictionNote !== undefined && typeof r.frictionNote !== 'string') return false;
  if (r.reflectionSummary !== null && r.reflectionSummary !== undefined && !isValidReflectionSummary(r.reflectionSummary)) return false;

  return true;
}

/**
 * Validate with detailed error message
 */
export function validateReflectionResponse(response: unknown): { valid: boolean; reason?: string } {
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
  if (r.frictionNote !== undefined && typeof r.frictionNote !== 'string') {
    return { valid: false, reason: `frictionNote is ${typeof r.frictionNote}, expected string or undefined` };
  }
  if (r.reflectionSummary !== null && r.reflectionSummary !== undefined && !isValidReflectionSummary(r.reflectionSummary)) {
    return { valid: false, reason: `reflectionSummary has invalid structure` };
  }

  return { valid: true };
}
