'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { IntakeState, Message } from '@/types/conversation';
import { IntakeAgentResponse } from './prompts/intakeAgent';
import {
  initializeConversation,
  addUserMessage,
  addAssistantMessage,
  buildConversationHistory,
  completeConversation,
  clearConversation,
} from '@/lib/store/conversationStore';
import { IntakeAnalytics } from '@/lib/analytics/intakeAnalytics';

interface UseIntakeAgentReturn {
  state: IntakeState;
  isLoading: boolean;
  error: string | null;
  streamingMessage: string | null;
  sendMessage: (message: string) => Promise<void>;
  forceRecommend: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
  startConversation: () => Promise<void>;
}

/**
 * Hook for managing the intake agent conversation with streaming support
 */
export function useIntakeAgent(): UseIntakeAgentReturn {
  const [state, setState] = useState<IntakeState>(() => initializeConversation());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Process streaming response from the API
   */
  const processStream = useCallback(
    async (
      currentState: IntakeState,
      forceRecommend: boolean = false
    ): Promise<IntakeState | null> => {
      const history = buildConversationHistory(currentState);

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/intake/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, forceRecommend }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get response');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedMessage = '';
        let finalResponse: IntakeAgentResponse | null = null;

        // Start showing streaming message
        setStreamingMessage('');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.chunk) {
                  accumulatedMessage += parsed.chunk;
                  // Extract just the message content for display (parse partial JSON)
                  const messageMatch = accumulatedMessage.match(/"message"\s*:\s*"([^"]*)/);
                  if (messageMatch) {
                    setStreamingMessage(messageMatch[1].replace(/\\n/g, '\n'));
                  }
                }

                if (parsed.done && parsed.response) {
                  finalResponse = parsed.response;
                }
              } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                  // Real error, not just partial JSON
                  if (!data.includes('"chunk"')) {
                    console.error('Stream parse error:', e);
                  }
                }
              }
            }
          }
        }

        // Clear streaming message
        setStreamingMessage(null);

        if (!finalResponse) {
          throw new Error('No response received');
        }

        // Add the complete message to state
        let newState = addAssistantMessage(
          currentState,
          finalResponse.message,
          finalResponse.phase,
          finalResponse.suggestedResponses,
          finalResponse.hypothesis,
          finalResponse.habitRecommendation
        );

        if (finalResponse.phase === 'ready_to_start') {
          newState = completeConversation(newState);
        }

        return newState;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          return null; // Request was aborted, not an error
        }
        throw e;
      }
    },
    []
  );

  // Start conversation with initial agent message
  const startConversation = useCallback(async () => {
    if (hasStarted || state.messages.length > 0) return;

    setHasStarted(true);
    setIsLoading(true);
    setError(null);
    IntakeAnalytics.conversationStarted();

    try {
      const newState = await processStream(state);
      if (newState) {
        setState(newState);
        // Log phase if we got one
        if (newState.currentPhase) {
          IntakeAnalytics.phaseChanged(null, newState.currentPhase, newState.turnCount);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start conversation';
      setError(errorMsg);
      setHasStarted(false);
      IntakeAnalytics.errorOccurred(errorMsg, 'startConversation');
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  }, [hasStarted, state, processStream]);

  // Auto-start conversation when component mounts
  useEffect(() => {
    if (state.messages.length === 0 && !hasStarted && !isLoading) {
      startConversation();
    }
  }, [state.messages.length, hasStarted, isLoading, startConversation]);

  // Send a user message
  const sendMessage = useCallback(
    async (message: string) => {
      if (isLoading || state.isComplete) return;

      setIsLoading(true);
      setError(null);

      // Add user message to state immediately
      const previousPhase = state.currentPhase;
      let currentState = addUserMessage(state, message);
      setState(currentState);

      try {
        const newState = await processStream(currentState);
        if (newState) {
          setState(newState);

          // Log phase transitions
          if (newState.currentPhase !== previousPhase) {
            IntakeAnalytics.phaseChanged(previousPhase, newState.currentPhase, newState.turnCount);

            // Special logging for recommendation phase
            if (newState.currentPhase === 'recommendation') {
              IntakeAnalytics.recommendationShown(newState.turnCount, newState.realLeverage);
            }

            // Log when user accepts (ready_to_start)
            if (newState.currentPhase === 'ready_to_start') {
              IntakeAnalytics.recommendationAccepted(newState.turnCount);
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        IntakeAnalytics.errorOccurred(errorMsg, 'sendMessage');
      } finally {
        setIsLoading(false);
        setStreamingMessage(null);
      }
    },
    [isLoading, state, processStream]
  );

  // Force recommendation (escape hatch)
  const forceRecommend = useCallback(async () => {
    if (isLoading || state.isComplete) return;

    setIsLoading(true);
    setError(null);
    IntakeAnalytics.escapeHatchUsed(state.turnCount);

    try {
      const previousPhase = state.currentPhase;
      const newState = await processStream(state, true);
      if (newState) {
        setState(newState);

        if (newState.currentPhase !== previousPhase) {
          IntakeAnalytics.phaseChanged(previousPhase, newState.currentPhase, newState.turnCount);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to force recommendation';
      setError(errorMsg);
      IntakeAnalytics.errorOccurred(errorMsg, 'forceRecommend');
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  }, [isLoading, state, processStream]);

  // Retry last action (handles both initial load and message send failures)
  const retry = useCallback(async () => {
    if (isLoading) return;

    setError(null);

    // If no messages yet, retry starting the conversation
    if (state.messages.length === 0) {
      setHasStarted(false);
      startConversation();
      return;
    }

    // Find the last user message to retry
    const lastUserMessageIndex = [...state.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserMessageIndex === -1) {
      // No user message to retry, try starting over
      startConversation();
      return;
    }

    // Get state before the failed response (remove the last user message and retry)
    const actualIndex = state.messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = state.messages[actualIndex];

    // Remove the last user message from state (it will be re-added by sendMessage)
    const stateBeforeLastMessage: IntakeState = {
      ...state,
      messages: state.messages.slice(0, actualIndex),
      turnCount: state.turnCount - 1,
    };
    setState(stateBeforeLastMessage);

    // Retry sending the message
    setIsLoading(true);
    try {
      const newState = await processStream(
        addUserMessage(stateBeforeLastMessage, lastUserMessage.content)
      );
      if (newState) {
        setState(newState);
      }
    } catch (err) {
      // Re-add the user message so conversation isn't lost
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, lastUserMessage],
        turnCount: prev.turnCount + 1,
      }));
      setError(err instanceof Error ? err.message : 'Failed to retry');
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  }, [isLoading, state, startConversation, processStream]);

  // Clear error without other actions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset conversation
  const reset = useCallback(() => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearConversation();
    setState(initializeConversation());
    setHasStarted(false);
    setError(null);
    setStreamingMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    isLoading,
    error,
    streamingMessage,
    sendMessage,
    forceRecommend,
    retry,
    clearError,
    reset,
    startConversation,
  };
}
