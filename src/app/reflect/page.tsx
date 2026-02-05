'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, updateHabitData, getCheckInStats } from '@/lib/store/habitStore';
import { HabitData, CheckIn, getCheckInState } from '@/types/habit';
import { analyzePatterns } from '@/lib/patterns/patternFinder';
import { getReflectionPrompt, ReflectionType } from '@/hooks/useReflectionTrigger';

type ReflectionStep =
  | 'summary'
  | 'sustainability'
  | 'friction'
  | 'recommendation'
  | 'complete';

interface ReflectionAnswers {
  sustainability: 'yes' | 'mostly' | 'no' | null;
  friction: string;
  acceptedRecommendation: boolean;
}

export default function ReflectPage() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<ReflectionStep>('summary');
  const [answers, setAnswers] = useState<ReflectionAnswers>({
    sustainability: null,
    friction: '',
    acceptedRecommendation: false,
  });
  const [reflectionType, setReflectionType] = useState<ReflectionType>('weekly');

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit configured
    if (!data || data.state === 'install') {
      router.push('/');
      return;
    }

    // Determine reflection type
    const checkIns = data.checkIns || [];
    const consecutiveMisses = countConsecutiveMisses(checkIns);
    if (consecutiveMisses >= 3) {
      setReflectionType('recovery');
    } else {
      setReflectionType('weekly');
    }
  }, [router]);

  if (isLoading || !habitData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Calculate stats for summary
  const stats = getCheckInStats(7);
  const checkIns = habitData.checkIns || [];
  const patterns = checkIns.length > 0
    ? analyzePatterns(checkIns, habitData.system?.habitType || 'time_anchored')
    : null;

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(habitData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(daysSinceCreation / 7);

  const prompt = getReflectionPrompt(reflectionType, daysSinceCreation, patterns?.currentStreak || 0);

  // Handle step navigation
  const handleNext = () => {
    const steps: ReflectionStep[] = ['summary', 'sustainability', 'friction', 'recommendation', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleComplete = () => {
    // Store reflection date
    const updated = updateHabitData({
      ...(habitData as any),
      lastReflectionDate: new Date().toISOString(),
    });
    router.push('/');
  };

  // Generate recommendation based on answers and patterns
  const generateRecommendation = (): { text: string; actionLabel: string; actionType: string } => {
    // Recovery reflection: focus on getting back on track
    if (reflectionType === 'recovery') {
      if (answers.friction.toLowerCase().includes('tired') || answers.friction.toLowerCase().includes('energy')) {
        return {
          text: 'Your energy is being depleted somewhere. Try doing your tiny version for the next 3 days — something is better than nothing.',
          actionLabel: 'Use tiny version',
          actionType: 'tiny_version',
        };
      }
      if (answers.friction.toLowerCase().includes('forgot') || answers.friction.toLowerCase().includes('remember')) {
        return {
          text: 'The anchor isn\'t catching your attention. Try adding a physical cue — something you\'ll see or touch at the trigger moment.',
          actionLabel: 'Update environment',
          actionType: 'environment',
        };
      }
      return {
        text: 'Three misses is normal data, not failure. Let\'s focus on just tomorrow — one rep. What would make that rep easier?',
        actionLabel: 'Simplify for tomorrow',
        actionType: 'general',
      };
    }

    // Weekly reflection: based on sustainability answer
    if (answers.sustainability === 'no') {
      return {
        text: 'If it doesn\'t feel sustainable, it won\'t last. Consider shrinking to your tiny version until it feels easy.',
        actionLabel: 'Shrink to tiny',
        actionType: 'tiny_version',
      };
    }

    if (answers.sustainability === 'mostly' && patterns?.weakDays && patterns.weakDays.length > 0) {
      return {
        text: `${patterns.weakDays.join(' and ')} seem harder. Consider a different anchor for those days, or pre-commit to the tiny version.`,
        actionLabel: 'Adjust weak days',
        actionType: 'anchor',
      };
    }

    if (patterns?.difficultyTrend === 'increasing') {
      return {
        text: 'The habit is getting harder, not easier. That\'s a sign to simplify before motivation runs out.',
        actionLabel: 'Simplify habit',
        actionType: 'tiny_version',
      };
    }

    if (patterns?.responseRateWhenTriggered && patterns.responseRateWhenTriggered >= 0.8) {
      return {
        text: 'Strong week. Keep doing exactly what you\'re doing — no changes needed.',
        actionLabel: 'Continue as-is',
        actionType: 'none',
      };
    }

    return {
      text: 'Week ' + weekNumber + ' complete. The goal for next week: protect what\'s working, adjust what isn\'t.',
      actionLabel: 'Got it',
      actionType: 'none',
    };
  };

  const recommendation = generateRecommendation();

  // Render current step
  switch (step) {
    case 'summary':
      return (
        <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <p className="text-sm text-[var(--text-tertiary)] mb-2">
              {reflectionType === 'recovery' ? 'Recovery Check-in' : `Week ${weekNumber} Reflection`}
            </p>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
              {prompt.title}
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {prompt.subtitle}
            </p>

            {/* Stats summary */}
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-8">
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
                Your Week
              </h2>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[var(--accent-primary)]">
                    {stats.completed + stats.recovered}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">
                    {stats.missed}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Missed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">
                    {stats.noTrigger}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">No trigger</p>
                </div>
              </div>

              {patterns && patterns.currentStreak > 0 && (
                <p className="text-sm text-[var(--text-secondary)] mt-4 text-center">
                  Current: {patterns.currentStreak} in a row
                </p>
              )}
            </div>

            {/* Pattern insights if available */}
            {patterns && patterns.totalCheckIns >= 7 && (
              <div className="mb-8">
                {patterns.strongDays.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    ✓ Strong on: {patterns.strongDays.join(', ')}
                  </p>
                )}
                {patterns.weakDays.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    ⚠ Harder on: {patterns.weakDays.join(', ')}
                  </p>
                )}
                {patterns.repeatedMissReason && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    ⚠ Common barrier: "{patterns.repeatedMissReason}"
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      );

    case 'sustainability':
      return (
        <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">Question 1 of 2</p>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-8">
              Did this feel sustainable?
            </h1>

            <div className="space-y-3 mb-8">
              {[
                { value: 'yes', label: 'Yes — I could keep this up', description: 'The routine felt natural' },
                { value: 'mostly', label: 'Mostly — some days were hard', description: 'A few friction points' },
                { value: 'no', label: 'No — it was a struggle', description: 'Something needs to change' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, sustainability: option.value as 'yes' | 'mostly' | 'no' }));
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    answers.sustainability === option.value
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className={`text-sm ${
                    answers.sustainability === option.value
                      ? 'text-white/80'
                      : 'text-[var(--text-tertiary)]'
                  }`}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!answers.sustainability}
              className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      );

    case 'friction':
      return (
        <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">Question 2 of 2</p>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
              What got in the way?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Even small friction matters. What made it harder?
            </p>

            <textarea
              value={answers.friction}
              onChange={(e) => setAnswers(prev => ({ ...prev, friction: e.target.value }))}
              placeholder="e.g., Too tired by evening, kept forgetting..."
              className="w-full h-32 p-4 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none mb-8"
            />

            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-full border border-[var(--border-primary)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );

    case 'recommendation':
      return (
        <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-[var(--text-tertiary)] mb-2">My suggestion</p>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-8">
              Here's what I'd try
            </h1>

            <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-8">
              <p className="text-[var(--text-primary)] leading-relaxed">
                {recommendation.text}
              </p>
            </div>

            <div className="space-y-3">
              {recommendation.actionType !== 'none' && (
                <button
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, acceptedRecommendation: true }));
                    handleNext();
                  }}
                  className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  {recommendation.actionLabel}
                </button>
              )}
              <button
                onClick={handleNext}
                className={`w-full py-4 rounded-full font-semibold text-lg transition-opacity ${
                  recommendation.actionType === 'none'
                    ? 'bg-[var(--accent-primary)] text-white hover:opacity-90'
                    : 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {recommendation.actionType === 'none' ? 'Got it' : 'Maybe later'}
              </button>
            </div>
          </div>
        </div>
      );

    case 'complete':
      return (
        <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8 flex flex-col items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✓</span>
            </div>

            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
              Reflection complete
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {answers.acceptedRecommendation
                ? 'Your adjustment is noted. Let\'s see how next week goes.'
                : 'Keep showing up. See you next week.'}
            </p>

            <button
              onClick={handleComplete}
              className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Back to home
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Helper function
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
