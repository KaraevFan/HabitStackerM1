'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, logEvent, skipRecovery } from '@/lib/store/habitStore';
import { HabitData } from '@/types/habit';
import { getUserState } from '@/hooks/useUserState';
import Button from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function RecoveryPage() {
  return (
    <ErrorBoundary screenName="Recovery">
      <RecoveryContent />
    </ErrorBoundary>
  );
}

function RecoveryContent() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit or not in missed state
    // Use getUserState (same logic as Home page) to avoid redirect loops
    const userState = getUserState(data);
    if (userState !== 'missed_yesterday') {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecoveryDone = () => {
    setCompleting(true);
    logEvent('recovery_done');
    router.push('/');
  };

  const handleSkip = () => {
    setCompleting(true);
    logEvent('skip', 'Skipped recovery');
    router.push('/');
  };

  const handleSkipToToday = () => {
    setCompleting(true);
    skipRecovery();
    router.push('/today');
  };

  if (isLoading || !habitData?.planDetails) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  const { planDetails } = habitData;

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <p className="text-sm text-[var(--text-tertiary)]">You missed yesterday</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              Quick recovery
            </h1>
          </div>

          {/* Encouragement */}
          <div className="rounded-xl bg-[var(--bg-secondary)] p-5 text-center">
            <p className="text-[var(--text-secondary)]">
              Missing happens. What matters is getting back on track quickly.
            </p>
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              Do this tiny action to restore your continuity.
            </p>
          </div>

          {/* Recovery Action */}
          <div className="rounded-xl border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-6">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">
              Recovery action
            </p>
            <p className="text-xl font-medium text-[var(--text-primary)]">
              {planDetails.recovery}
            </p>
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              Takes less than 30 seconds
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRecoveryDone}
              disabled={completing}
              size="lg"
              className="w-full"
            >
              {completing ? 'Saving...' : 'Done — I\'m back'}
            </Button>

            <button
              onClick={handleSkip}
              disabled={completing}
              className="w-full py-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Skip for now
            </button>
          </div>

          {/* Context */}
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            Recovery counts as a rep. You&apos;re not starting over.
          </p>

          {/* Escape hatch — skip recovery, go to today's check-in (3A) */}
          <button
            onClick={handleSkipToToday}
            disabled={completing}
            className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline"
          >
            Skip recovery — go to today&apos;s check-in
          </button>
        </div>
      </div>
    </div>
  );
}
