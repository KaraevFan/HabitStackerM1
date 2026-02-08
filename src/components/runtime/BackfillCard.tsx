'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getYesterdayDateString } from '@/lib/dateUtils';
import { logCheckIn, skipRecovery } from '@/lib/store/habitStore';
import { HabitData } from '@/types/habit';

interface BackfillCardProps {
  habitData: HabitData;
  onResolved: (updated: HabitData) => void;
}

/**
 * Backfill disambiguation card.
 * Shown when yesterday has no check-in and user opens the app.
 * Offers: "I did it" (backfill yesterday), "I missed it" (recovery), "Skip to today".
 */
export default function BackfillCard({ habitData, onResolved }: BackfillCardProps) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);

  const handleDidIt = () => {
    setResolving(true);
    const yesterday = getYesterdayDateString();
    const updated = logCheckIn(
      {
        date: yesterday,
        triggerOccurred: true,
        actionTaken: true,
        recoveryOffered: false,
      },
      yesterday
    );
    onResolved(updated);
  };

  const handleMissed = () => {
    setResolving(true);
    router.push('/recovery');
  };

  const handleSkipToToday = () => {
    setResolving(true);
    const updated = skipRecovery();
    onResolved(updated);
  };

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          How did last night go?
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          We didn&apos;t hear from you yesterday.
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleDidIt}
          disabled={resolving}
          className="w-full py-3.5 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
        >
          I did it
        </button>
        <button
          onClick={handleMissed}
          disabled={resolving}
          className="w-full py-3.5 rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium text-base hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
        >
          I missed it
        </button>
        <button
          onClick={handleSkipToToday}
          disabled={resolving}
          className="w-full py-2.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
        >
          Skip — log for today
        </button>
      </div>
    </div>
  );
}
