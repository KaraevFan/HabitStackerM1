'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadHabitData } from '@/lib/store/habitStore';
import { saveReflection } from '@/lib/store/habitStore';
import { HabitData, generateReflectionId, CheckIn, getCheckInState } from '@/types/habit';
import { applySystemUpdate } from '@/lib/store/systemUpdater';
import { getCheckInStats } from '@/lib/store/habitStore';
import WeeklyReflectionConversation, {
  ReflectionResult,
} from '@/components/reflection/WeeklyReflectionConversation';
import CoachIntentSheet from '@/components/reflection/CoachIntentSheet';

export default function ReflectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    }>
      <ReflectPageContent />
    </Suspense>
  );
}

function ReflectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reflectionType, setReflectionType] = useState<'weekly' | 'recovery' | 'on_demand'>('weekly');
  const [showIntentSheet, setShowIntentSheet] = useState(false);
  const [onDemandIntent, setOnDemandIntent] = useState<string | undefined>();
  const [weekNumber, setWeekNumber] = useState(0);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    if (!data || data.state === 'install') {
      router.push('/');
      return;
    }

    // Determine mode from search params
    const mode = searchParams.get('mode');
    if (mode === 'on_demand') {
      setReflectionType('on_demand');
      setShowIntentSheet(true);
    } else if (mode === 'recovery') {
      setReflectionType('recovery');
    } else {
      // Auto-detect: check for consecutive misses
      const checkIns = data.checkIns || [];
      const consecutiveMisses = countConsecutiveMisses(checkIns);
      setReflectionType(consecutiveMisses >= 3 ? 'recovery' : 'weekly');
    }

    // Compute week number
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    setWeekNumber(Math.floor(daysSinceCreation / 7));
  }, [router, searchParams]);

  if (isLoading || !habitData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  // Show intent sheet for on-demand mode
  if (showIntentSheet) {
    return (
      <CoachIntentSheet
        onSelectIntent={(intent) => {
          setOnDemandIntent(intent);
          setShowIntentSheet(false);
        }}
        onCancel={() => router.push('/')}
      />
    );
  }

  const handleComplete = (result: ReflectionResult) => {
    // Apply system update if recommendation was accepted
    if (result.recommendation?.accepted && result.recommendation.appliesTo !== 'none' && result.recommendation.newValue) {
      applySystemUpdate({
        field: result.recommendation.appliesTo,
        newValue: result.recommendation.newValue,
        source: reflectionType === 'recovery' ? 'recovery_reflection' : reflectionType === 'on_demand' ? 'on_demand' : 'weekly_reflection',
      });
    }

    // Build check-ins summary
    const stats = getCheckInStats(7);
    const checkIns = habitData.checkIns || [];
    const recentWithDifficulty = checkIns
      .filter(c => c.difficultyRating != null)
      .slice(-7);
    const avgDifficulty = recentWithDifficulty.length > 0
      ? recentWithDifficulty.reduce((acc, c) => acc + (c.difficultyRating || 3), 0) / recentWithDifficulty.length
      : 3;

    // Save reflection
    saveReflection({
      id: generateReflectionId(),
      weekNumber,
      completedAt: new Date().toISOString(),
      type: reflectionType,
      sustainability: result.sustainability,
      friction: result.friction,
      recommendation: result.recommendation ? {
        text: result.recommendation.text,
        changes: result.recommendation.newValue ? [result.recommendation.newValue] : [],
        appliesTo: result.recommendation.appliesTo,
        accepted: result.recommendation.accepted,
        appliedAt: result.recommendation.accepted ? new Date().toISOString() : undefined,
      } : null,
      checkInsSummary: {
        completed: stats.completed + stats.recovered,
        total: stats.total,
        avgDifficulty: Math.round(avgDifficulty * 10) / 10,
        difficultyTrend: avgDifficulty <= 2 ? 'easier' : avgDifficulty >= 4 ? 'harder' : 'stable',
      },
      conversation: {
        messages: result.messages,
        duration: result.duration,
      },
    });

    // Fire coach notes update async (Phase 5)
    if (habitData.system?.coachNotes) {
      fetch('/api/coach-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'update',
          existingNotes: habitData.system.coachNotes,
          reflectionData: {
            type: reflectionType,
            sustainability: result.sustainability,
            friction: result.friction,
            recommendation: result.recommendation,
          },
        }),
      }).catch(() => {}); // Fire and forget
    }

    router.push('/');
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <WeeklyReflectionConversation
      habitData={habitData}
      reflectionType={reflectionType}
      weekNumber={weekNumber}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onDemandIntent={onDemandIntent}
    />
  );
}

function countConsecutiveMisses(checkIns: CheckIn[]): number {
  const sorted = [...checkIns].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let misses = 0;
  for (const checkIn of sorted) {
    const state = getCheckInState(checkIn);
    if (state === 'missed') {
      misses++;
    } else if (state === 'completed' || state === 'recovered') {
      break;
    }
  }

  return misses;
}
