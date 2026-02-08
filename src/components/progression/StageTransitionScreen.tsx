'use client';

import { StageInfo } from '@/lib/progression/stageDetector';

interface StageTransitionScreenProps {
  stageCompleted: StageInfo;
  nextStage: StageInfo | null;
  stats: {
    repsCount: number;
    completionRate: number;
    weekNumber: number;
  };
  onContinue: () => void;
  onReflect: () => void;
}

/**
 * Full-page celebration at stage boundaries
 */
export default function StageTransitionScreen({
  stageCompleted,
  nextStage,
  stats,
  onContinue,
  onReflect,
}: StageTransitionScreenProps) {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-md mx-auto text-center">
        {/* Celebration icon */}
        <div className="w-20 h-20 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">
            {stageCompleted.index === 0 ? '🌱' :
             stageCompleted.index === 1 ? '🛡️' :
             stageCompleted.index === 2 ? '🎯' : '🔄'}
          </span>
        </div>

        {/* Stage completed */}
        <p className="text-sm text-[var(--accent-primary)] font-medium uppercase tracking-wide mb-2">
          Week {stats.weekNumber} Complete
        </p>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
          &ldquo;{stageCompleted.name}&rdquo; — done.
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {stageCompleted.successCriteria}
        </p>

        {/* Stats */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                {stats.repsCount}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Total reps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                {Math.round(stats.completionRate * 100)}%
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">This week</p>
            </div>
          </div>
        </div>

        {/* Next phase briefing */}
        {nextStage && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mb-8 text-left">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              Next Phase
            </p>
            <p className="font-display text-lg font-semibold text-[var(--text-primary)] mb-1">
              Week {stageCompleted.index + 2}: {nextStage.name}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {nextStage.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
          <button
            onClick={onReflect}
            className="w-full py-3 text-center text-sm text-[var(--accent-primary)] hover:opacity-80"
          >
            Reflect on this week
          </button>
        </div>
      </div>
    </div>
  );
}
