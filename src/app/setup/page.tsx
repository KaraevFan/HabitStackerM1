'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat';
import { OnboardingFlow } from '@/components/onboarding';
import { useIntakeAgent } from '@/lib/ai/useIntakeAgent';
import { loadHabitData, updateHabitData } from '@/lib/store/habitStore';
import { extractPlanFromRecommendation } from '@/types/conversation';
import { IntakeAnalytics } from '@/lib/analytics/intakeAnalytics';
import { HabitSystem, SetupItem } from '@/types/habit';
import { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';
import { formatRitualStatement } from '@/lib/format';

/**
 * Convert recommendation to HabitSystem
 */
function recommendationToSystem(
  rec: HabitRecommendation,
  checkedSetupItems?: Set<string>
): HabitSystem {
  // Convert setup checklist items with IDs
  const setupChecklist: SetupItem[] = (rec.setupChecklist || []).map((item, index) => {
    const id = `setup-${index}`;
    return {
      id,
      category: item.category,
      text: item.text,
      completed: checkedSetupItems?.has(id) || false,
      notApplicable: false,
    };
  });

  return {
    anchor: rec.anchor,
    action: rec.action,
    ritualStatement: rec.ritualStatement,
    then: rec.followUp,
    recovery: rec.recovery,
    whyItFits: rec.whyItFits || [],
    identity: rec.identity,
    identityBehaviors: rec.identityBehaviors,
    setupChecklist: setupChecklist.length > 0 ? setupChecklist : undefined,
    // V0.6: Habit type and education fields
    habitType: rec.habitType || 'time_anchored', // Default for backwards compatibility
    anchorTime: rec.anchorTime,
    checkInTime: rec.checkInTime,
    principle: rec.principle,
    expectations: rec.expectations,
    // R14: Reminder settings (data model now, notifications later)
    reminderTime: rec.reminderTime,
    reminderLabel: rec.reminderLabel,
    // R18: Personalized rationale
    rationale: rec.rationale,
  };
}

/**
 * Setup page - Chat-based intake flow
 *
 * Flow:
 * 1. Chat with intake agent (discovery → reflection → recommendation)
 * 2. User accepts → show multi-screen OnboardingFlow
 * 3. User completes onboarding → save to HabitData → runtime
 *
 * Note: Feedback rating moved to post-first-rep (not during onboarding)
 */
export default function SetupPage() {
  const router = useRouter();
  const {
    state,
    isLoading,
    isHydrated,
    error,
    streamingMessage,
    sendMessage,
    forceRecommend,
    retry,
    clearError,
    reset,
  } = useIntakeAgent();

  // Track if we're showing the onboarding flow
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-transition to onboarding when agent is ready
  useEffect(() => {
    if (state.currentPhase === 'ready_to_start' && state.recommendation && !showOnboarding) {
      // Brief delay so user sees the final message
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setIsTransitioning(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.currentPhase, state.recommendation, showOnboarding]);

  // Show onboarding when ready
  const shouldShowOnboarding = showOnboarding && state.recommendation;

  // Handle onboarding completion
  const handleOnboardingComplete = (startNow: boolean, checkedSetupItems?: Set<string>) => {
    if (!state.recommendation) return;

    // Log analytics
    if (startNow) {
      IntakeAnalytics.firstRepStarted(null, state.turnCount);
    } else {
      IntakeAnalytics.firstRepDeferred(null, state.turnCount);
    }

    // Save to HabitData
    const planDetails = extractPlanFromRecommendation(state.recommendation);
    const system = recommendationToSystem(state.recommendation, checkedSetupItems);
    const ritualLine = state.recommendation.ritualStatement
      ?? formatRitualStatement(planDetails.anchor, planDetails.action);

    if (startNow) {
      // Activate habit — first real rep will be logged via logCheckIn()
      updateHabitData({
        state: 'active',
        planDetails,
        system,
        snapshot: {
          line1: 'Week 1: Show up.',
          line2: ritualLine,
          ritualStatement: state.recommendation.ritualStatement,
        },
        intakeState: {
          ...state,
          feltUnderstoodRating: null, // Moved to post-first-rep
          isComplete: true,
          completedAt: new Date().toISOString(),
        },
      });
    } else {
      // Save but don't log first rep
      updateHabitData({
        state: 'designed',
        planDetails,
        system,
        snapshot: {
          line1: 'Week 1: Show up.',
          line2: ritualLine,
          ritualStatement: state.recommendation.ritualStatement,
        },
        intakeState: {
          ...state,
          feltUnderstoodRating: null,
          isComplete: true,
          completedAt: new Date().toISOString(),
        },
      });
    }

    // Fire coach notes generation async (Phase 5)
    if (state.messages && state.messages.length > 0) {
      fetch('/api/coach-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          intakeTranscript: state.messages,
          habitSystem: system,
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.coachNotes) {
              // Load fresh state — don't use stale `system` closure
              const fresh = loadHabitData();
              if (fresh.system) {
                updateHabitData({
                  system: { ...fresh.system, coachNotes: data.coachNotes },
                });
              }
            }
          }
        })
        .catch(() => {}); // Fire and forget
    }

    // Navigate to home
    router.push('/');
  };

  // Handle going back from onboarding to chat
  const handleBackToChat = () => {
    setShowOnboarding(false);
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" role="status" aria-label="Loading" />
          <p className="text-[var(--text-secondary)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show transition state
  if (isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" role="status" aria-label="Loading" />
          <p className="text-[var(--text-secondary)]">
            Preparing your habit...
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding flow
  if (shouldShowOnboarding && state.recommendation) {
    return (
      <OnboardingFlow
        recommendation={state.recommendation}
        onComplete={handleOnboardingComplete}
        onBackToChat={handleBackToChat}
      />
    );
  }

  // Show chat interface
  return (
    <div className="flex flex-col min-h-dvh bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-tertiary)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Design Your Habit
        </h1>
        <button
          onClick={reset}
          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Start over
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
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
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Try again'}
          </button>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden bg-[var(--bg-primary)]">
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
        <details className="px-4 py-2 border-t border-[var(--bg-tertiary)] text-xs">
          <summary className="cursor-pointer text-[var(--text-tertiary)]">Debug info</summary>
          <pre className="mt-2 p-2 bg-[var(--bg-secondary)] rounded overflow-auto max-h-40 text-[var(--text-secondary)]">
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
