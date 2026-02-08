/**
 * Stage Detector (R18)
 *
 * Calendar-day-based stage detection (not rep-count-based).
 * Stage 0: <7d  — "Show Up"
 * Stage 1: 7-13d — "Protect the Routine"
 * Stage 2: 14-20d — "Add the Reward"
 * Stage 3: 21+ — "Reflect & Adjust"
 */

export interface StageInfo {
  index: number;
  name: string;
  description: string;
  successCriteria: string;
}

export const STAGES: StageInfo[] = [
  {
    index: 0,
    name: 'Show Up',
    description: "Just do the action. Don't optimize.",
    successCriteria: 'Success = doing it, regardless of quality.',
  },
  {
    index: 1,
    name: 'Protect the Routine',
    description: 'Notice what threatens it. Recover quickly.',
    successCriteria: 'Success = recovering quickly from misses.',
  },
  {
    index: 2,
    name: 'Add the Reward',
    description: 'Link the habit to something you enjoy.',
    successCriteria: 'Success = looking forward to the routine.',
  },
  {
    index: 3,
    name: 'Reflect & Adjust',
    description: 'Is this the right habit? Time to tune.',
    successCriteria: 'Success = honest assessment, one adjustment.',
  },
];

/**
 * Detect current stage based on calendar days since creation
 */
export function detectStage(createdAt: string): StageInfo {
  const created = new Date(createdAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= 21) return STAGES[3];
  if (daysSince >= 14) return STAGES[2];
  if (daysSince >= 7) return STAGES[1];
  return STAGES[0];
}

/**
 * Check if a stage transition should be shown
 * True within 24h of crossing a boundary, not already shown today
 */
export function shouldShowStageTransition(
  createdAt: string,
  lastStageShownAt?: string
): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show at boundaries: 7, 14, 21
  const boundaries = [7, 14, 21];
  const isAtBoundary = boundaries.some(
    (b) => daysSince >= b && daysSince < b + 1
  );

  if (!isAtBoundary) return false;

  // Check if already shown in last 24 hours
  if (lastStageShownAt) {
    const hoursSinceShown = (now.getTime() - new Date(lastStageShownAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceShown < 24) return false;
  }

  return true;
}
