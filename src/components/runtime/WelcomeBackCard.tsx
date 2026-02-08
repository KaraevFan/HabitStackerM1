'use client';

import { useState } from 'react';
import { skipRecovery } from '@/lib/store/habitStore';
import { HabitData } from '@/types/habit';

interface WelcomeBackCardProps {
  habitData: HabitData;
  onResolved: (updated: HabitData) => void;
}

/**
 * Welcome-back card for users inactive 7+ days.
 * Gentler than recovery — acknowledges the gap and offers a fresh start.
 */
export default function WelcomeBackCard({ habitData, onResolved }: WelcomeBackCardProps) {
  const [resolving, setResolving] = useState(false);

  const habitAction = habitData.system?.action || habitData.planDetails?.action || 'your habit';

  const handleRestart = () => {
    setResolving(true);
    const updated = skipRecovery();
    onResolved(updated);
  };

  return (
    <div className="rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-subtle)] p-5 space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          Welcome back
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          It&apos;s been a while — that&apos;s completely okay. Gaps happen.
          What matters is you&apos;re here now.
        </p>
      </div>

      <div className="rounded-lg bg-[var(--bg-primary)] p-3 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Pick up where you left off:</p>
        <p className="text-base font-medium text-[var(--text-primary)] mt-1">
          {habitAction}
        </p>
      </div>

      <button
        onClick={handleRestart}
        disabled={resolving}
        className="w-full py-3.5 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
      >
        {resolving ? 'Restarting...' : "I'm ready — let's go"}
      </button>
    </div>
  );
}
