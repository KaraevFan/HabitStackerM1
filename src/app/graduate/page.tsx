'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, graduateHabit } from '@/lib/store/habitStore';
import { HabitData } from '@/types/habit';
import { assessGraduation } from '@/lib/progression/graduationDetector';
import GraduationCelebration from '@/components/graduation/GraduationCelebration';
import WhatsNextScreen from '@/components/graduation/WhatsNextScreen';

function getInitialData(): HabitData | null {
  if (typeof window === 'undefined') return null;
  return loadHabitData();
}

export default function GraduatePage() {
  const router = useRouter();
  const [habitData] = useState<HabitData | null>(getInitialData);
  const [showWhatsNext, setShowWhatsNext] = useState(false);

  if (!habitData || habitData.state === 'install') {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
  }

  if (!habitData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  const assessment = assessGraduation(habitData, habitData.checkIns || []);

  if (showWhatsNext) {
    return (
      <WhatsNextScreen
        onStartNew={() => {
          graduateHabit();
          router.push('/setup');
        }}
        onGoHome={() => router.push('/')}
      />
    );
  }

  return (
    <GraduationCelebration
      habitData={habitData}
      assessment={assessment}
      onGraduate={() => {
        graduateHabit();
        setShowWhatsNext(true);
      }}
      onNotYet={() => router.push('/')}
      onMakeHarder={() => router.push('/reflect?mode=on_demand')}
    />
  );
}
