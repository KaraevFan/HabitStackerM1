"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadHabitData, updateHabitData } from "@/lib/store/habitStore";
import { HabitData } from "@/types/habit";
import { getUserState } from "@/hooks/useUserState";
import { shouldShowStageTransition, detectStage, STAGES } from "@/lib/progression/stageDetector";
import PlanScreen from "@/components/runtime/PlanScreen";
import WelcomeScreen from "@/components/runtime/WelcomeScreen";
import { ContextScreen } from "@/components/runtime/ContextScreen";
import BackfillCard from "@/components/runtime/BackfillCard";
import WelcomeBackCard from "@/components/runtime/WelcomeBackCard";
import StageTransitionScreen from "@/components/progression/StageTransitionScreen";
import RestorePrompt from "@/components/common/RestorePrompt";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

/**
 * Home page with state-based routing
 *
 * Routes to different experiences based on user lifecycle:
 * - new_user → Landing page (WelcomeScreen)
 * - mid_conversation → Redirect to /setup
 * - system_designed → PlanScreen with "Ready to start" prompt
 * - missed_yesterday → Redirect to /recovery
 * - active_today / completed_today / needs_tuneup → PlanScreen
 */
export default function Home() {
  return (
    <ErrorBoundary screenName="Home">
      <HomeContent />
    </ErrorBoundary>
  );
}

function HomeContent() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Check if data was restored from backup and needs confirmation
    if (data._needsRestoreConfirmation) {
      setShowRestorePrompt(true);
      return;
    }

    // Determine user state and route accordingly
    const userState = getUserState(data);

    // Handle redirects for states that need different pages
    if (userState === 'mid_conversation') {
      router.push('/setup');
      return;
    }

    // missed_yesterday and needs_reentry now handled on home screen
    // via backfill disambiguation UI — no redirect needed

    // Check for stage transition celebration
    if (data && data.state === 'active' && data.createdAt) {
      if (shouldShowStageTransition(data.createdAt, data.lastStageShownAt)) {
        setShowStageTransition(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - router is stable

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" role="status" aria-label="Loading" />
          <p className="text-[var(--text-tertiary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Restore prompt
  if (showRestorePrompt) {
    return (
      <RestorePrompt
        onRestored={() => window.location.reload()}
        onDismissed={() => {
          setShowRestorePrompt(false);
          setHabitData(loadHabitData());
        }}
      />
    );
  }

  // Determine what to show based on user state
  const userState = getUserState(habitData);

  // New user → Context screen (pre-intake explainer)
  if (userState === 'new_user') {
    return <ContextScreen />;
  }

  // Paused state
  if (habitData?.state === 'paused') {
    return (
      <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Habit Paused
          </h1>
          <p className="text-[var(--text-secondary)]">
            {habitData.pauseReason || 'Your habit is paused. Resume when you\'re ready.'}
          </p>
          <button
            onClick={() => {
              updateHabitData({ state: 'active', pausedAt: undefined, pauseReason: undefined });
              window.location.reload();
            }}
            className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Resume Habit
          </button>
          <button
            onClick={() => router.push('/setup')}
            className="w-full py-3 text-center text-sm text-[var(--accent-primary)] hover:opacity-80"
          >
            Start a different habit
          </button>
        </div>
      </div>
    );
  }

  // Maintained (graduated) state
  if (habitData?.state === 'maintained') {
    return (
      <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center mx-auto">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Habit Graduated
          </h1>
          <p className="text-[var(--text-secondary)]">
            You&apos;ve built this habit into your life. Ready for the next one?
          </p>
          <button
            onClick={() => router.push('/setup')}
            className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Start a New Habit
          </button>
        </div>
      </div>
    );
  }

  // Stage transition celebration
  if (showStageTransition && habitData) {
    const currentStage = detectStage(habitData.createdAt);
    const completedStage = currentStage.index > 0 ? STAGES[currentStage.index - 1] : STAGES[0];
    const nextStage = currentStage.index < STAGES.length - 1 ? STAGES[currentStage.index] : null;
    const checkIns = habitData.checkIns || [];
    const weekCheckIns = checkIns.filter(c => {
      const daysDiff = Math.floor(
        (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff < 7;
    });
    const completedCount = weekCheckIns.filter(c => c.actionTaken || c.recoveryCompleted).length;

    return (
      <StageTransitionScreen
        stageCompleted={completedStage}
        nextStage={nextStage}
        stats={{
          repsCount: habitData.repsCount,
          completionRate: weekCheckIns.length > 0 ? completedCount / weekCheckIns.length : 0,
          weekNumber: completedStage.index + 1,
        }}
        onContinue={() => {
          updateHabitData({ lastStageShownAt: new Date().toISOString() });
          setShowStageTransition(false);
        }}
        onReflect={() => {
          updateHabitData({ lastStageShownAt: new Date().toISOString() });
          router.push('/reflect');
        }}
      />
    );
  }

  // All other states that stay on home → PlanScreen
  // (mid_conversation and missed_yesterday already redirected above)
  if (habitData) {
    return <PlanScreen habitData={habitData} />;
  }

  // Fallback to context screen
  return <ContextScreen />;
}
