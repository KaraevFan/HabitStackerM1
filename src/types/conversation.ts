/**
 * Conversation types for the agent-first intake flow
 */

import { ConversationPhase, HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';

// Re-export for convenience
export type { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';

/**
 * A single message in the conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedResponses?: string[] | null;
  timestamp: string;
  /** For assistant messages, which phase this was */
  phase?: ConversationPhase;
}

/**
 * Full intake state for the conversation
 */
export interface IntakeState {
  // What the agent understands
  userGoal: string | null; // What they said they want
  realLeverage: string | null; // Agent's hypothesis about what will actually help

  // Conversation tracking
  currentPhase: ConversationPhase;
  turnCount: number;

  // Full conversation
  messages: Message[];

  // Recommendation (generated when in recommendation phase or later)
  recommendation: HabitRecommendation | null;

  // Completion tracking
  isComplete: boolean;
  feltUnderstoodRating: number | null; // 1-5 scale

  // Timestamps
  startedAt: string;
  completedAt: string | null;
}

/**
 * Create initial intake state
 */
export function createInitialIntakeState(): IntakeState {
  return {
    userGoal: null,
    realLeverage: null,
    currentPhase: 'discovery',
    turnCount: 0,
    messages: [],
    recommendation: null,
    isComplete: false,
    feltUnderstoodRating: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a user message
 */
export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(
  content: string,
  phase: ConversationPhase,
  suggestedResponses?: string[] | null
): Message {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    suggestedResponses,
    phase,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if conversation is in a terminal phase
 */
export function isConversationComplete(state: IntakeState): boolean {
  return state.currentPhase === 'ready_to_start' || state.isComplete;
}

/**
 * Extract plan details from recommendation
 * Used when user accepts and we need to save to HabitData
 * Note: prime is legacy field, we join followUp array for backwards compatibility
 */
export function extractPlanFromRecommendation(rec: HabitRecommendation) {
  // Convert followUp array to single string for legacy PlanDetails.prime field
  const prime = rec.followUp && rec.followUp.length > 0
    ? rec.followUp.join(', ')
    : null;

  return {
    anchor: rec.anchor,
    action: rec.action,
    prime,
    recovery: rec.recovery,
  };
}
