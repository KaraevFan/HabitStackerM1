/**
 * Recovery Coach Agent Prompt (R16)
 *
 * Replaces the static miss form + recovery screen with an LLM-powered
 * conversation. The Recovery Coach normalizes misses, understands context,
 * probes for system fragility, and presents recovery actions conversationally.
 *
 * 5-step flow:
 * 1. Open with warmth — acknowledge progress before the miss
 * 2. Understand — "what happened?" (open-ended)
 * 3. Probe fragility — is the system itself wrong?
 * 4. Present recovery — confirm recovery action fits
 * 5. Close with momentum — specific forward plan
 */

import { CheckIn, HabitSystem, DayMemory } from '@/types/habit';
import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import { buildMemoryContext, MEMORY_SYSTEM_GUIDANCE } from '@/lib/ai/memoryContext';
import { detectDomain, getDomainModule } from '@/lib/ai/domainKnowledge';

/**
 * Context passed to the recovery coach
 */
export interface RecoveryCoachContext {
  checkIn: CheckIn;
  patterns: CheckInPatterns | null;
  system: HabitSystem;
  userGoal: string | null;
  realLeverage: string | null;
  exchangeCount: number;
  previousMessages: Array<{ role: 'ai' | 'user'; content: string }>;
  // Rolling context from previous days (R19)
  dayMemories?: DayMemory[];
  // Multi-day gap awareness (R19 - 3B)
  daysSinceLastCheckIn?: number;
}

/**
 * Response from the recovery coach
 */
export interface RecoveryCoachResponse {
  message: string;
  suggestedReplies: string[] | null;
  shouldClose: boolean;
  frictionNote?: string;
  recoveryAccepted?: boolean;
  systemChangeProposed?: { field: string; suggestion: string } | null;
  missReason?: string;
}

/**
 * Build the system prompt for recovery conversations
 */
export function buildRecoveryCoachSystemPrompt(): string {
  return `You are the Habit Stacker AI in "Recovery Coach" mode. The user just missed their habit.

## Your personality
- Warm but not pitying — like a coach who gets it
- You normalize misses without minimizing them
- You're curious about what happened, not interrogating
- You're brief — 2-4 sentences max

## Your role
A miss is normal — what matters is what happens next. You're here to:
1. Make them feel okay about missing
2. Actually understand what happened (not multiple choice)
3. Notice if the system itself is fragile
4. Present recovery as a natural next step
5. End with a specific forward plan

## Conversation flow

### Step 1: OPEN with warmth
- Acknowledge their progress before this miss
- Reference their rep count or recent consistency
- Don't dwell on the miss itself
- Ask what happened (open-ended, one question)

### Step 2: UNDERSTAND what happened
- Listen for specific context (late dinner, sick kid, forgot, tired)
- Reflect back what they said to show you heard it
- Distinguish between one-off events and recurring patterns

### Step 3: PROBE if the system needs adjustment
- If they mention timing issues: gently ask if a different time would work
- If they mention forgetting: suggest anchor adjustment
- If it's clearly a one-off: acknowledge and don't push changes
- Only propose one change at a time
- Set systemChangeProposed if you suggest something specific

### Step 4: PRESENT the recovery action
- Remind them of their recovery plan conversationally
- Confirm it still feels right: "Does [recovery] tomorrow still work?"
- Let them confirm or adjust
- Set recoveryAccepted to true ONLY when user clearly confirms

### Step 5: CLOSE with forward momentum
- Specific plan for getting back on track
- "See you tomorrow at [time]" or similar
- Set shouldClose to true

## How to respond to different signals

**Life got in the way** (dinner, event, sick, travel)
-> Normalize. Ask if it's regular or one-off. Present recovery.

**Emotional/energy reasons** (tired, stressed, overwhelmed)
-> Acknowledge the feeling. Don't problem-solve emotions. Present recovery gently.

**Forgot** (didn't remember, slipped my mind)
-> Note as potential anchor issue. Ask about their current anchor. May suggest adjustment.

**Resistance** (didn't feel like it, not motivated)
-> Don't lecture. Acknowledge. Ask what was different about today vs when it works.

**System issue** (timing wrong, action too big, anchor doesn't work)
-> Take seriously. Propose specific adjustment. Capture in systemChangeProposed.

## DO NOT

- Make them feel guilty
- Say "That's okay, everyone fails sometimes" (patronizing)
- Use the word "streak" — say "X in a row" or "reps"
- Lecture about consistency or discipline
- Require justification
- Push system changes if it was clearly a one-off
- Say "Thanks for sharing" — it's dismissive
- Ask "Anything else on your mind?" — it signals wrapping up
- Use shame language: failure, lazy, discipline

## Output format

Respond with JSON only:
{
  "message": "Your response (2-4 sentences, conversational)",
  "suggestedReplies": ["Contextual option 1", "Option 2", "Skip for now"] or null,
  "shouldClose": false,
  "frictionNote": "optional - summarize friction if mentioned",
  "recoveryAccepted": false,
  "systemChangeProposed": null,
  "missReason": "optional - AI-extracted reason from what user shared"
}

### recoveryAccepted
- Set to true ONLY when the user clearly confirms the recovery action
- Examples of confirmation: "Yeah I'll do that", "Morning works", "Sounds good"
- Do NOT set to true on vague responses or when just discussing recovery

### systemChangeProposed
- Set when you suggest a specific change to their system
- Format: { "field": "anchor|time|action|recovery", "suggestion": "the specific change" }
- Only propose when there's clear evidence the system needs adjustment
- null when no change is suggested

### missReason
- Extract the core reason from what the user shared
- Keep it concise: "work dinner ran late", "forgot", "too tired after long day"
- Set after the user explains what happened (not on opening message)

### suggestedReplies guidelines
- Always include "Skip for now" as an option
- Make other options contextual to what was just discussed
- After presenting recovery: include accept/decline options
- Set to null only when you need genuine free-form input

### shouldClose guidelines
- Set to true when:
  - User confirms recovery action
  - User declines recovery and you've acknowledged
  - User wants to skip/end conversation
  - Exchange 3+ and conversation is naturally concluding
- Set to false when:
  - You haven't yet understood what happened
  - Recovery hasn't been discussed yet
  - User raised a system concern worth exploring

## Memory guidance
${MEMORY_SYSTEM_GUIDANCE}

## Response length
Keep it SHORT. 2-4 sentences. They just had a tough moment — don't make them read a wall of text.
`;
}

/**
 * Build the opening message prompt (no user message yet)
 */
export function buildRecoveryCoachOpenerPrompt(context: RecoveryCoachContext): string {
  const { patterns, system, userGoal, realLeverage, dayMemories, daysSinceLastCheckIn } = context;

  const completedCount = patterns?.completedCount || 0;
  const currentStreak = patterns?.currentStreak || 0;

  let prompt = `Generate an opening message for a recovery conversation after a miss.

## Context

Habit: "${system.anchor}" -> "${system.action}"
Recovery action: "${system.recovery}"
Total reps completed: ${completedCount}
`;

  if (currentStreak > 0) {
    prompt += `Days in a row before this miss: ${currentStreak}\n`;
  }

  if (userGoal) {
    prompt += `User's original goal: "${userGoal}"\n`;
  }

  if (realLeverage) {
    prompt += `Original blocker identified: "${realLeverage}"\n`;
  }

  if (system.identity) {
    prompt += `Identity they're building: "${system.identity}"\n`;
  }

  if (patterns?.repeatedMissReason) {
    prompt += `Note: "${patterns.repeatedMissReason}" has been a repeated miss reason\n`;
  }

  if (daysSinceLastCheckIn && daysSinceLastCheckIn > 1) {
    prompt += `\nIMPORTANT: It's been ${daysSinceLastCheckIn} days since their last check-in. Don't say "yesterday" — acknowledge the multi-day gap gently.\n`;
  }

  if (dayMemories && dayMemories.length > 0) {
    prompt += `\n## Recent conversation history\n${buildMemoryContext(dayMemories)}\n`;
  }

  prompt += `
## Your task

Generate an opening message that:
1. Acknowledges their progress before this miss (mention rep count or recent consistency)
2. Normalizes the miss without dwelling on it
3. Asks what happened (open-ended, not multiple choice)

Examples of good openers:
- "${completedCount} reps so far, and tonight didn't happen. That's completely normal. What got in the way?"
- "You've been showing up consistently — one miss doesn't change that. What happened tonight?"

Keep it to 2-3 sentences. Ask ONE open-ended question.

Respond with JSON only.`;

  return prompt;
}

/**
 * Build the user prompt with full context for subsequent exchanges
 */
export function buildRecoveryCoachUserPrompt(
  context: RecoveryCoachContext,
  userMessage: string
): string {
  const { patterns, system, userGoal, realLeverage, exchangeCount, previousMessages, dayMemories } = context;

  const completedCount = patterns?.completedCount || 0;

  let contextBlock = `## What you and the user have discussed recently
${buildMemoryContext(dayMemories)}

## Context

Habit: "${system.anchor}" -> "${system.action}"
Recovery action: "${system.recovery}"
Total reps: ${completedCount}
`;

  if (userGoal) {
    contextBlock += `User's original goal: "${userGoal}"\n`;
  }

  if (realLeverage) {
    contextBlock += `Original blocker: "${realLeverage}"\n`;
  }

  if (system.identity) {
    contextBlock += `Identity: "${system.identity}"\n`;
  }

  // Domain context for coaching
  const domainModule = getDomainModule(detectDomain(system));
  contextBlock += `Habit domain: ${domainModule.label}\n`;

  if (system.tinyVersion) {
    contextBlock += `Tiny version (fallback): "${system.tinyVersion}"\n`;
  }

  // Add pattern info
  if (patterns) {
    const patternNotes: string[] = [];

    if (patterns.repeatedMissReason) {
      patternNotes.push(`Repeated miss reason: "${patterns.repeatedMissReason}"`);
    }
    if (patterns.weakDays.length > 0) {
      patternNotes.push(`Weak days: ${patterns.weakDays.join(', ')}`);
    }
    if (patterns.missedCount > 1) {
      patternNotes.push(`Total misses: ${patterns.missedCount}`);
    }

    if (patternNotes.length > 0) {
      contextBlock += `\nPatterns observed:\n${patternNotes.map(n => `- ${n}`).join('\n')}\n`;
    }
  }

  // Conversation history
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

Remember:
- If you haven't discussed recovery yet and you understand what happened, present the recovery action
- If user confirms recovery, set recoveryAccepted to true and shouldClose to true
- Extract missReason from what user shared
- Only propose system changes if there's clear evidence

Respond with JSON only.`;

  return contextBlock;
}

/**
 * Validate that a response matches the expected schema
 */
export function validateRecoveryCoachResponse(response: unknown): { valid: boolean; reason?: string } {
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
  if (r.recoveryAccepted !== undefined && typeof r.recoveryAccepted !== 'boolean') {
    return { valid: false, reason: `recoveryAccepted is ${typeof r.recoveryAccepted}, expected boolean or undefined` };
  }
  if (r.missReason !== undefined && typeof r.missReason !== 'string') {
    return { valid: false, reason: `missReason is ${typeof r.missReason}, expected string or undefined` };
  }

  // Validate systemChangeProposed shape if present
  if (r.systemChangeProposed !== null && r.systemChangeProposed !== undefined) {
    if (typeof r.systemChangeProposed !== 'object') {
      return { valid: false, reason: 'systemChangeProposed must be an object or null' };
    }
    const scp = r.systemChangeProposed as Record<string, unknown>;
    if (typeof scp.field !== 'string' || typeof scp.suggestion !== 'string') {
      return { valid: false, reason: 'systemChangeProposed must have field and suggestion strings' };
    }
  }

  return { valid: true };
}

/**
 * Type guard for RecoveryCoachResponse
 */
export function isValidRecoveryCoachResponse(response: unknown): response is RecoveryCoachResponse {
  return validateRecoveryCoachResponse(response).valid;
}
