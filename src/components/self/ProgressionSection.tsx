'use client';

import { detectStage, STAGES } from '@/lib/progression/stageDetector';

interface ProgressionSectionProps {
  repsCount: number;
  createdAt: string;
}

/**
 * ProgressionSection - Display 4-week progression arc
 * Uses calendar-day-based detection, gated behind Week 1 completion
 */
export default function ProgressionSection({
  repsCount,
  createdAt,
}: ProgressionSectionProps) {
  const daysSince = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Gate: show placeholder before day 7
  if (daysSince < 7) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          Your Progression
        </p>
        <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Your progression arc will appear after your first week.
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Day {daysSince + 1} of 7
          </p>
        </div>
      </div>
    );
  }

  const currentStage = detectStage(createdAt);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Your Progression
      </p>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const isCurrent = stage.index === currentStage.index;
          const isCompleted = stage.index < currentStage.index;
          const isFuture = stage.index > currentStage.index;

          return (
            <div
              key={stage.name}
              className={`rounded-lg p-3 transition-all ${
                isCurrent
                  ? 'bg-[var(--accent-subtle)] border border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)]'
              } ${isFuture ? 'opacity-50' : ''}`}
            >
              {/* Stage header */}
              <div className="flex items-center gap-2 mb-1">
                {/* Status indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isCompleted
                      ? 'bg-[var(--accent-primary)] text-white'
                      : isCurrent
                      ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                      : 'border-2 border-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{stage.index + 1}</span>
                  )}
                </div>

                {/* Stage name */}
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-[var(--accent-primary)]'
                      : isFuture
                      ? 'text-[var(--text-tertiary)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  Week {stage.index + 1}: {stage.name}
                </span>

                {/* Current indicator */}
                {isCurrent && (
                  <span className="text-xs text-[var(--accent-primary)] ml-auto">
                    You are here
                  </span>
                )}
              </div>

              {/* Stage description (show for current stage) */}
              {isCurrent && (
                <div className="ml-7 space-y-1">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {stage.description}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {stage.successCriteria}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
