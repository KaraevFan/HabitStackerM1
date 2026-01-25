/**
 * Conversation store for the agent-first intake flow
 *
 * Manages conversation state persistence to localStorage
 */

import {
  IntakeState,
  Message,
  HabitRecommendation,
  createInitialIntakeState,
  createUserMessage,
  createAssistantMessage,
} from '@/types/conversation';
import { ConversationPhase } from '@/lib/ai/prompts/intakeAgent';

const STORAGE_KEY = 'habit-stacker-conversation';

/**
 * Load conversation state from localStorage
 */
export function loadConversation(): IntakeState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as IntakeState;
  } catch (error) {
    console.error('[ConversationStore] Error loading conversation:', error);
    return null;
  }
}

/**
 * Save conversation state to localStorage
 */
export function saveConversation(state: IntakeState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[ConversationStore] Error saving conversation:', error);
  }
}

/**
 * Clear conversation from localStorage
 */
export function clearConversation(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[ConversationStore] Error clearing conversation:', error);
  }
}

/**
 * Initialize a new conversation or resume existing
 */
export function initializeConversation(): IntakeState {
  const existing = loadConversation();

  // Resume if exists and not complete
  if (existing && !existing.isComplete) {
    console.log('[ConversationStore] Resuming existing conversation');
    return existing;
  }

  // Start fresh
  console.log('[ConversationStore] Starting new conversation');
  const newState = createInitialIntakeState();
  saveConversation(newState);
  return newState;
}

/**
 * Add a user message to the conversation
 */
export function addUserMessage(state: IntakeState, content: string): IntakeState {
  const message = createUserMessage(content);
  const newState: IntakeState = {
    ...state,
    messages: [...state.messages, message],
    turnCount: state.turnCount + 1,
  };
  saveConversation(newState);
  return newState;
}

/**
 * Add an assistant message to the conversation
 */
export function addAssistantMessage(
  state: IntakeState,
  content: string,
  phase: ConversationPhase,
  suggestedResponses?: string[] | null,
  hypothesis?: string | null,
  habitRecommendation?: HabitRecommendation | null
): IntakeState {
  const message = createAssistantMessage(content, phase, suggestedResponses);
  const newState: IntakeState = {
    ...state,
    messages: [...state.messages, message],
    currentPhase: phase,
    realLeverage: hypothesis ?? state.realLeverage,
    // Store recommendation when provided (from recommendation phase onward)
    recommendation: habitRecommendation ?? state.recommendation,
  };
  saveConversation(newState);
  return newState;
}

/**
 * Update the user's goal (extracted from conversation)
 */
export function updateUserGoal(state: IntakeState, goal: string): IntakeState {
  const newState: IntakeState = {
    ...state,
    userGoal: goal,
  };
  saveConversation(newState);
  return newState;
}

/**
 * Set the recommendation
 */
export function setRecommendation(
  state: IntakeState,
  recommendation: HabitRecommendation
): IntakeState {
  const newState: IntakeState = {
    ...state,
    recommendation,
  };
  saveConversation(newState);
  return newState;
}

/**
 * Mark conversation as complete
 */
export function completeConversation(
  state: IntakeState,
  feltUnderstoodRating?: number
): IntakeState {
  const newState: IntakeState = {
    ...state,
    isComplete: true,
    completedAt: new Date().toISOString(),
    feltUnderstoodRating: feltUnderstoodRating ?? null,
  };
  saveConversation(newState);
  return newState;
}

/**
 * Get the last assistant message (for displaying pills)
 */
export function getLastAssistantMessage(state: IntakeState): Message | null {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    if (state.messages[i].role === 'assistant') {
      return state.messages[i];
    }
  }
  return null;
}

/**
 * Check if we should show the "I think you understand" escape hatch
 */
export function shouldShowEscapeHatch(state: IntakeState): boolean {
  // Show after 3+ user messages and still in discovery
  const userMessageCount = state.messages.filter(m => m.role === 'user').length;
  return userMessageCount >= 3 && state.currentPhase === 'discovery';
}

/**
 * Build conversation history for API calls
 * Returns messages in a format suitable for the AI
 */
export function buildConversationHistory(state: IntakeState): Array<{
  role: 'user' | 'assistant';
  content: string;
}> {
  return state.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
}
