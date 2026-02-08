'use client';

import { HabitData } from '@/types/habit';
import { GraduationAssessment } from '@/lib/progression/graduationDetector';

interface GraduationCelebrationProps {
  habitData: HabitData;
  assessment: GraduationAssessment;
  onGraduate: () => void;
  onNotYet: () => void;
  onMakeHarder: () => void;
}

export default function GraduationCelebration({
  habitData,
  assessment,
  onGraduate,
  onNotYet,
  onMakeHarder,
}: GraduationCelebrationProps) {
  const daysSince = Math.floor(
    (Date.now() - new Date(habitData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-md mx-auto text-center">
        {/* Celebration */}
        <div className="w-20 h-20 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎓</span>
        </div>

        <p className="text-sm text-[var(--accent-primary)] font-medium uppercase tracking-wide mb-2">
          Graduation Ready
        </p>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
          You did it.
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {daysSince} days of building &ldquo;{habitData.system?.action}&rdquo; into your life.
        </p>

        {/* Stats */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                {habitData.repsCount}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Total reps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                {daysSince}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Days active</p>
            </div>
          </div>
        </div>

        {/* Criteria checklist */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
            Graduation Criteria
          </p>
          <div className="space-y-2">
            {assessment.criteria.map((criterion) => (
              <div key={criterion.label} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  criterion.met
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'border-2 border-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                }`}>
                  {criterion.met ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>&times;</span>
                  )}
                </div>
                <span className={`text-sm ${criterion.met ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                  {criterion.label}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                  {criterion.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onGraduate}
            className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Ready to move on
          </button>
          <button
            onClick={onMakeHarder}
            className="w-full py-3 text-center text-sm text-[var(--accent-primary)] hover:opacity-80"
          >
            Make it harder
          </button>
          <button
            onClick={onNotYet}
            className="w-full py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}
