'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, updateSystemToolkit } from '@/lib/store/habitStore';
import { HabitData, getPlanScreenState } from '@/types/habit';
import { TuneUpExtractedData } from '@/lib/ai/prompts/tuneUpAgent';
import TuneUpScreen from '@/components/tuneup/TuneUpScreen';

export default function TuneUpPage() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit system or not eligible for tune-up
    if (!data?.system) {
      router.push('/setup');
      return;
    }

    const planState = getPlanScreenState(data);
    if (planState === 'pre_first_rep') {
      // Need to complete first rep first
      router.push('/');
      return;
    }

    if (planState === 'needs_photo_for_tuneup') {
      // Need photo to unlock tune-up
      router.push('/');
      return;
    }
  }, [router]);

  const handleComplete = (toolkit: TuneUpExtractedData) => {
    updateSystemToolkit({
      tinyVersion: toolkit.tinyVersion,
      environmentPrime: toolkit.environmentPrime,
      frictionReduced: toolkit.frictionNotes,
    });
    router.push('/system');
  };

  const handleBack = () => {
    router.push('/');
  };

  if (isLoading || !habitData?.system) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  const { system, repLogs } = habitData;
  const repsCompleted = repLogs?.filter(r => r.type === 'done').length ?? habitData.repsCount;

  return (
    <TuneUpScreen
      habitInfo={{
        anchor: system.anchor,
        action: system.action,
        repsCompleted,
      }}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
