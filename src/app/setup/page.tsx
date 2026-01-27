'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat';
import { ConfirmationScreen } from '@/components/confirmation';
import { useIntakeAgent } from '@/lib/ai/useIntakeAgent';
import { updateHabitData } from '@/lib/store/habitStore';
import { extractPlanFromRecommendation } from '@/types/conversation';
import { IntakeAnalytics } from '@/lib/analytics/intakeAnalytics';
import { HabitSystem, SetupItem } from '@/types/habit';
import { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';

/**
 * Convert recommendation to HabitSystem
 */
function recommendationToSystem(rec: HabitRecommendation): HabitSystem {
  // Convert setup checklist items with IDs
  const setupChecklist: SetupItem[] = (rec.setupChecklist || []).map((item, index) => ({
    id: `setup-${index}`,
    category: item.category,
    text: item.text,
    completed: false,
    notApplicable: false,
  }));

  return {
    anchor: rec.anchor,
    action: rec.action,
    then: rec.followUp,
    recovery: rec.recovery,
    whyItFits: rec.whyItFits || [],
    identity: rec.identity,
    identityBehaviors: rec.identityBehaviors,
    setupChecklist: setupChecklist.length > 0 ? setupChecklist : undefined,
  };
}

/**
 * Setup page - Chat-based intake flow
 *
 * Flow:
 * 1. Chat with intake agent (discovery → reflection → recommendation)
 * 2. User accepts → show ConfirmationScreen
 * 3. User rates understanding + starts first rep → save to HabitData → runtime
 */
export default function SetupPage() {
  const router = useRouter();
  const {
    state,
    isLoading,
    error,
    streamingMessage,
    sendMessage,
    forceRecommend,
    retry,
    clearError,
    reset,
  } = useIntakeAgent();

  // Track if we're showing the confirmation screen
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-transition to confirmation when agent is ready
  useEffect(() => {
    if (state.currentPhase === 'ready_to_start' && state.recommendation && !showConfirmation) {
      // Brief delay so user sees the final message
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setShowConfirmation(true);
        setIsTransitioning(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.currentPhase, state.recommendation, showConfirmation]);

  // Show confirmation when ready
  const shouldShowConfirmation = showConfirmation && state.recommendation;

  // Handle starting first rep
  const handleStartFirstRep = (feltUnderstoodRating: number | null) => {
    if (!state.recommendation) return;

    // Log analytics
    if (feltUnderstoodRating !== null) {
      IntakeAnalytics.feltUnderstoodRated(feltUnderstoodRating, state.turnCount);
    }
    IntakeAnalytics.firstRepStarted(feltUnderstoodRating, state.turnCount);

    // Save to HabitData
    const planDetails = extractPlanFromRecommendation(state.recommendation);
    const system = recommendationToSystem(state.recommendation);

    updateHabitData({
      state: 'active',
      planDetails,
      system,
      snapshot: {
        line1: 'Week 1: Show up.',
        line2: `After ${planDetails.anchor}, ${planDetails.action}.`,
      },
      intakeState: {
        ...state,
        feltUnderstoodRating,
        isComplete: true,
        completedAt: new Date().toISOString(),
      },
      repsCount: 1,
      lastDoneDate: new Date().toISOString().split('T')[0],
    });

    // Navigate to plan/home
    router.push('/');
  };

  // Handle starting later
  const handleStartLater = (feltUnderstoodRating: number | null) => {
    if (!state.recommendation) return;

    // Log analytics
    if (feltUnderstoodRating !== null) {
      IntakeAnalytics.feltUnderstoodRated(feltUnderstoodRating, state.turnCount);
    }
    IntakeAnalytics.firstRepDeferred(feltUnderstoodRating, state.turnCount);

    // Save to HabitData but don't log first rep
    const planDetails = extractPlanFromRecommendation(state.recommendation);
    const system = recommendationToSystem(state.recommendation);

    updateHabitData({
      state: 'designed',
      planDetails,
      system,
      snapshot: {
        line1: 'Week 1: Show up.',
        line2: `After ${planDetails.anchor}, ${planDetails.action}.`,
      },
      intakeState: {
        ...state,
        feltUnderstoodRating,
        isComplete: true,
        completedAt: new Date().toISOString(),
      },
    });

    // Navigate to plan/home
    router.push('/');
  };

  // Handle going back from confirmation to chat
  const handleBackToChat = () => {
    setShowConfirmation(false);
  };

  // Show transition state
  if (isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Preparing your habit...
          </p>
        </div>
      </div>
    );
  }

  // Show confirmation screen
  if (shouldShowConfirmation && state.recommendation) {
    return (
      <ConfirmationScreen
        recommendation={state.recommendation}
        onStartFirstRep={handleStartFirstRep}
        onStartLater={handleStartLater}
        onBack={handleBackToChat}
      />
    );
  }

  // Show chat interface
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Design Your Habit
        </h1>
        <button
          onClick={reset}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Start over
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={retry}
            disabled={isLoading}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Try again'}
          </button>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          state={state}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          streamingMessage={streamingMessage}
          onEscapeHatch={forceRecommend}
        />
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
          <summary className="cursor-pointer text-zinc-500">Debug info</summary>
          <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded overflow-auto max-h-40">
            {JSON.stringify(
              {
                phase: state.currentPhase,
                turnCount: state.turnCount,
                hypothesis: state.realLeverage,
                messageCount: state.messages.length,
                hasRecommendation: !!state.recommendation,
                isComplete: state.isComplete,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
