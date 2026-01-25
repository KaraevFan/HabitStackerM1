'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, logRep, updateRepPhoto } from '@/lib/store/habitStore';
import { HabitData, getHabitEmoji } from '@/types/habit';
import Button from '@/components/ui/Button';
import PhotoPromptScreen from '@/components/photo/PhotoPromptScreen';

type FlowState = 'action' | 'photo_prompt' | 'celebration';

export default function TodayPage() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flowState, setFlowState] = useState<FlowState>('action');
  const [currentRepId, setCurrentRepId] = useState<string | null>(null);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit or in install state
    if (!data || data.state === 'install') {
      router.push('/setup');
    }
  }, [router]);

  const handleDone = () => {
    // Log the rep without photo first
    const updated = logRep('done');
    const lastRep = updated.repLogs?.[updated.repLogs.length - 1];
    if (lastRep) {
      setCurrentRepId(lastRep.id);
    }
    setHabitData(updated);
    setFlowState('photo_prompt');
  };

  const handlePhotoSaved = (photoUri: string) => {
    if (currentRepId) {
      updateRepPhoto(currentRepId, photoUri);
    }
    setFlowState('celebration');
    // Brief celebration, then navigate home
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handlePhotoSkipped = () => {
    setFlowState('celebration');
    // Brief celebration, then navigate home
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleMissed = () => {
    logRep('missed');
    router.push('/');
  };

  if (isLoading || !habitData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Show photo prompt after marking done
  if (flowState === 'photo_prompt') {
    return (
      <PhotoPromptScreen
        onPhotoSaved={handlePhotoSaved}
        onSkip={handlePhotoSkipped}
      />
    );
  }

  // Show celebration screen
  if (flowState === 'celebration') {
    const repsCount = habitData.repsCount;
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
          {repsCount === 1 ? 'First rep complete!' : 'Rep complete!'}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {repsCount} rep{repsCount !== 1 ? 's' : ''} total
        </p>
      </div>
    );
  }

  // Main action screen
  const { planDetails, system, snapshot } = habitData;

  // Get habit info - prefer system (from intake agent), fall back to planDetails (legacy)
  const anchor = system?.anchor || planDetails?.anchor || 'your trigger';
  const action = system?.action || planDetails?.action || 'your habit';
  const then = system?.then || planDetails?.prime;
  const emoji = getHabitEmoji(anchor, action);

  // Generate hero statement
  let cleanAnchor = anchor.replace(/^after\s+/i, '').trim();
  cleanAnchor = cleanAnchor.charAt(0).toLowerCase() + cleanAnchor.slice(1);
  let cleanAction = action.trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);
  const heroStatement = `When I ${cleanAnchor}, I ${cleanAction}.`;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="px-4 py-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Page Title */}
        <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-6">
          Today&apos;s rep
        </p>

        {/* Emoji */}
        <div className="text-5xl mb-6" role="img" aria-label="habit icon">
          {emoji}
        </div>

        {/* Hero Statement */}
        <blockquote className="text-xl font-serif text-center text-[var(--text-primary)] max-w-[300px] leading-relaxed mb-6">
          &ldquo;{heroStatement}&rdquo;
        </blockquote>

        {/* Then (if present) */}
        {then && (
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Then: {then}
          </p>
        )}

        {/* Week reminder */}
        <p className="text-sm text-[var(--text-tertiary)]">
          {snapshot?.line1 || 'Week 1: Show up.'}
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        <Button
          onClick={handleDone}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Done
        </Button>

        <button
          onClick={handleMissed}
          className="w-full py-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          I missed today
        </button>
      </div>
    </div>
  );
}
