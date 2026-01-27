'use client';

interface ProgressionSectionProps {
  repsCount: number;
  createdAt: string;
}

/**
 * Static progression stages (hardcoded)
 */
const PROGRESSION_STAGES = [
  {
    id: 'week_1',
    name: 'Show Up',
    description: "Just do the action. Don't optimize.",
    successCriteria: 'Success = doing it, regardless of quality.',
    unlockAfter: 0,
  },
  {
    id: 'week_2',
    name: 'Protect the Routine',
    description: 'Notice what threatens it. Recover quickly.',
    successCriteria: 'Success = recovering quickly from misses.',
    unlockAfter: 7,
  },
  {
    id: 'week_3',
    name: 'Add the Reward',
    description: 'Link the habit to something you enjoy.',
    successCriteria: 'Success = looking forward to the routine.',
    unlockAfter: 14,
  },
  {
    id: 'week_4',
    name: 'Reflect & Adjust',
    description: 'Is this the right habit? Time to tune.',
    successCriteria: 'Success = honest assessment, one adjustment.',
    unlockAfter: 21,
  },
];

/**
 * Get current stage based on reps count
 */
function getCurrentStageIndex(repsCount: number): number {
  // Find the highest stage where repsCount >= unlockAfter
  let currentIndex = 0;
  for (let i = 0; i < PROGRESSION_STAGES.length; i++) {
    if (repsCount >= PROGRESSION_STAGES[i].unlockAfter) {
      currentIndex = i;
    }
  }
  return currentIndex;
}

/**
 * ProgressionSection - Display 4-week progression arc
 * Shows where user is in their habit journey
 */
export default function ProgressionSection({
  repsCount,
}: ProgressionSectionProps) {
  const currentStageIndex = getCurrentStageIndex(repsCount);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Your Progression
      </p>

      {/* Stages */}
      <div className="space-y-3">
        {PROGRESSION_STAGES.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const isFuture = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`rounded-lg p-3 transition-all ${
                isCurrent
                  ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]'
                  : 'bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)]'
              } ${isFuture ? 'opacity-50' : ''}`}
            >
              {/* Stage header */}
              <div className="flex items-center gap-2 mb-1">
                {/* Status indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isCompleted
                      ? 'bg-[var(--accent)] text-white'
                      : isCurrent
                      ? 'border-2 border-[var(--accent)] text-[var(--accent)]'
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
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Stage name */}
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-[var(--accent)]'
                      : isFuture
                      ? 'text-[var(--text-tertiary)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  Week {index + 1}: {stage.name}
                </span>

                {/* Current indicator */}
                {isCurrent && (
                  <span className="text-xs text-[var(--accent)] ml-auto">
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
