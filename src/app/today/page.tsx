'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadHabitData } from '@/lib/store/habitStore';
import { HabitData } from '@/types/habit';
import { CheckInFlow } from '@/components/checkin';

type EntryMode = 'default' | 'early' | 'miss';

function TodayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine entry mode from URL params
  const getEntryMode = (): EntryMode => {
    if (searchParams.get('early') === 'true') return 'early';
    if (searchParams.get('miss') === 'true') return 'miss';
    return 'default';
  };
  const entryMode = getEntryMode();

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit or in install state
    if (!data || data.state === 'install') {
      router.push('/setup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - router is stable

  if (isLoading || !habitData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Build effective system from habit data
  // Prefer system (new flow), fall back to planDetails (legacy)
  const effectiveSystem = habitData.system || (habitData.planDetails ? {
    anchor: habitData.planDetails.anchor || 'your trigger',
    action: habitData.planDetails.action || 'your habit',
    recovery: habitData.planDetails.recovery || 'Just try again tomorrow.',
    habitType: 'time_anchored' as const,
    whyItFits: [],
  } : null);

  // No habit configured - redirect to setup
  if (!effectiveSystem) {
    router.push('/setup');
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Redirecting to setup...</p>
      </div>
    );
  }

  // All habits go through CheckInFlow
  return (
    <CheckInFlow
      system={effectiveSystem}
      entryMode={entryMode}
      onComplete={() => router.push('/')}
    />
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    }>
      <TodayPageContent />
    </Suspense>
  );
}
