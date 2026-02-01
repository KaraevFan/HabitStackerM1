import { CheckIn, HabitType, getCheckInState } from '@/types/habit';

/**
 * Pattern analysis result from check-in history
 * Used by conversation generator and insights display
 */
export interface CheckInPatterns {
  // Counts
  totalCheckIns: number;
  completedCount: number;
  missedCount: number;
  noTriggerCount: number;
  recoveredCount: number;

  // Rates
  triggerOccurrenceRate: number;
  responseRateWhenTriggered: number;
  recoveryRate: number;
  outcomeSuccessRate: number;

  // Streaks
  currentStreak: number;
  currentNoTriggerStreak: number;
  longestStreak: number;

  // Day-of-week
  dayOfWeekStats: Record<string, { completed: number; missed: number; total: number }>;
  strongDays: string[];
  weakDays: string[];

  // Miss patterns
  missReasonCounts: Record<string, number>;
  repeatedMissReason: string | null;

  // Difficulty
  averageDifficulty: number;
  difficultyTrend: 'decreasing' | 'stable' | 'increasing';

  // Trends (last 7 vs previous 7)
  trends: {
    responseRateImproving: boolean;
    triggerOccurrenceDecreasing: boolean;
    difficultyDecreasing: boolean;
  };

  // Milestone flags
  isFirstRep: boolean;
  isFirstMiss: boolean;
  isFirstRecovery: boolean;
  justCompletedWeek1: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Analyze check-in history to find patterns
 */
export function analyzePatterns(
  checkIns: CheckIn[],
  habitType: HabitType
): CheckInPatterns {
  // Sort by date descending (most recent first)
  const sorted = [...checkIns].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Basic counts
  const completedCount = sorted.filter(c => c.triggerOccurred && c.actionTaken).length;
  const missedCount = sorted.filter(c => c.triggerOccurred && !c.actionTaken).length;
  const noTriggerCount = sorted.filter(c => !c.triggerOccurred).length;
  const recoveredCount = sorted.filter(c => c.recoveryCompleted).length;

  // Rates
  const triggerOccurrenceRate = sorted.length > 0
    ? sorted.filter(c => c.triggerOccurred).length / sorted.length
    : 0;

  const triggeredCheckIns = sorted.filter(c => c.triggerOccurred);
  const responseRateWhenTriggered = triggeredCheckIns.length > 0
    ? triggeredCheckIns.filter(c => c.actionTaken).length / triggeredCheckIns.length
    : 0;

  // Streaks
  const currentStreak = calculateCurrentStreak(sorted, habitType);
  const currentNoTriggerStreak = calculateNoTriggerStreak(sorted);
  const longestStreak = calculateLongestStreak(sorted, habitType);

  // Day of week analysis
  const dayOfWeekStats = analyzeDayOfWeek(sorted);
  const { strongDays, weakDays } = identifyStrongWeakDays(dayOfWeekStats);

  // Miss reason patterns
  const missReasonCounts = countMissReasons(sorted);
  const repeatedMissReason = findRepeatedReason(missReasonCounts);

  // Difficulty analysis
  const averageDifficulty = calculateAverageDifficulty(sorted);
  const difficultyTrend = calculateDifficultyTrend(sorted);

  // Trends
  const trends = analyzeTrends(sorted);

  // Milestones
  const isFirstRep = completedCount === 1;
  const isFirstMiss = missedCount === 1;
  const isFirstRecovery = recoveredCount === 1;
  const justCompletedWeek1 = sorted.length === 7;

  return {
    totalCheckIns: sorted.length,
    completedCount,
    missedCount,
    noTriggerCount,
    recoveredCount,
    triggerOccurrenceRate,
    responseRateWhenTriggered,
    recoveryRate: missedCount > 0 ? recoveredCount / missedCount : 0,
    outcomeSuccessRate: calculateOutcomeSuccessRate(sorted),
    currentStreak,
    currentNoTriggerStreak,
    longestStreak,
    dayOfWeekStats,
    strongDays,
    weakDays,
    missReasonCounts,
    repeatedMissReason,
    averageDifficulty,
    difficultyTrend,
    trends,
    isFirstRep,
    isFirstMiss,
    isFirstRecovery,
    justCompletedWeek1,
  };
}

/**
 * Calculate current completion streak
 * For reactive habits, no-trigger days don't break the streak
 */
function calculateCurrentStreak(checkIns: CheckIn[], habitType: HabitType): number {
  let streak = 0;
  for (const checkIn of checkIns) {
    const state = getCheckInState(checkIn);

    if (state === 'completed' || state === 'recovered') {
      streak++;
    } else if (state === 'missed') {
      break;
    } else if (state === 'no_trigger') {
      // For reactive habits, no-trigger doesn't break streak
      if (habitType !== 'reactive') {
        break;
      }
      // Don't count no-trigger in streak, but don't break it either
    }
  }
  return streak;
}

/**
 * Calculate current no-trigger streak (for reactive habits)
 */
function calculateNoTriggerStreak(checkIns: CheckIn[]): number {
  let streak = 0;
  for (const checkIn of checkIns) {
    if (!checkIn.triggerOccurred) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calculate longest completion streak ever
 */
function calculateLongestStreak(checkIns: CheckIn[], habitType: HabitType): number {
  // Sort chronologically (oldest first) for proper streak calculation
  const chronological = [...checkIns].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let longest = 0;
  let current = 0;

  for (const checkIn of chronological) {
    const state = getCheckInState(checkIn);

    if (state === 'completed' || state === 'recovered') {
      current++;
      longest = Math.max(longest, current);
    } else if (state === 'missed') {
      current = 0;
    } else if (state === 'no_trigger' && habitType !== 'reactive') {
      current = 0;
    }
    // For reactive habits, no-trigger continues streak (doesn't add to it)
  }

  return longest;
}

/**
 * Analyze check-ins by day of week
 */
function analyzeDayOfWeek(
  checkIns: CheckIn[]
): Record<string, { completed: number; missed: number; total: number }> {
  const stats: Record<string, { completed: number; missed: number; total: number }> = {};

  // Initialize all days
  for (const day of DAY_NAMES) {
    stats[day] = { completed: 0, missed: 0, total: 0 };
  }

  for (const checkIn of checkIns) {
    const date = new Date(checkIn.date);
    const dayName = DAY_NAMES[date.getDay()];
    const state = getCheckInState(checkIn);

    stats[dayName].total++;

    if (state === 'completed' || state === 'recovered') {
      stats[dayName].completed++;
    } else if (state === 'missed') {
      stats[dayName].missed++;
    }
  }

  return stats;
}

/**
 * Identify strong and weak days based on completion rate
 * Strong: >=80% completion, Weak: <=40% completion (with min 2 data points)
 */
function identifyStrongWeakDays(
  stats: Record<string, { completed: number; missed: number; total: number }>
): { strongDays: string[]; weakDays: string[] } {
  const strongDays: string[] = [];
  const weakDays: string[] = [];

  for (const [day, data] of Object.entries(stats)) {
    if (data.total < 2) continue; // Need at least 2 data points

    const completionRate = data.completed / data.total;

    if (completionRate >= 0.8) {
      strongDays.push(day);
    } else if (completionRate <= 0.4 && data.missed >= 1) {
      weakDays.push(day);
    }
  }

  return { strongDays, weakDays };
}

/**
 * Count occurrences of each miss reason
 */
function countMissReasons(checkIns: CheckIn[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const checkIn of checkIns) {
    if (checkIn.missReason) {
      const reason = checkIn.missReason.toLowerCase();
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Find the most repeated miss reason (must appear 2+ times)
 */
function findRepeatedReason(counts: Record<string, number>): string | null {
  let maxReason: string | null = null;
  let maxCount = 1; // Must appear at least 2 times

  for (const [reason, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxReason = reason;
    }
  }

  return maxReason;
}

/**
 * Calculate average difficulty rating
 */
function calculateAverageDifficulty(checkIns: CheckIn[]): number {
  const withDifficulty = checkIns.filter(c => c.difficultyRating != null);

  if (withDifficulty.length === 0) {
    return 3; // Default middle value
  }

  const sum = withDifficulty.reduce((acc, c) => acc + (c.difficultyRating || 3), 0);
  return sum / withDifficulty.length;
}

/**
 * Calculate difficulty trend (comparing recent vs older check-ins)
 */
function calculateDifficultyTrend(
  checkIns: CheckIn[]
): 'decreasing' | 'stable' | 'increasing' {
  const withDifficulty = checkIns.filter(c => c.difficultyRating != null);

  if (withDifficulty.length < 4) {
    return 'stable'; // Not enough data
  }

  const midpoint = Math.floor(withDifficulty.length / 2);
  const recent = withDifficulty.slice(0, midpoint);
  const older = withDifficulty.slice(midpoint);

  const recentAvg = recent.reduce((acc, c) => acc + (c.difficultyRating || 3), 0) / recent.length;
  const olderAvg = older.reduce((acc, c) => acc + (c.difficultyRating || 3), 0) / older.length;

  const difference = recentAvg - olderAvg;

  if (difference <= -0.5) {
    return 'decreasing';
  } else if (difference >= 0.5) {
    return 'increasing';
  }

  return 'stable';
}

/**
 * Analyze trends comparing last 7 days vs previous 7 days
 */
function analyzeTrends(checkIns: CheckIn[]): {
  responseRateImproving: boolean;
  triggerOccurrenceDecreasing: boolean;
  difficultyDecreasing: boolean;
} {
  if (checkIns.length < 8) {
    return {
      responseRateImproving: false,
      triggerOccurrenceDecreasing: false,
      difficultyDecreasing: false,
    };
  }

  const recent = checkIns.slice(0, 7);
  const previous = checkIns.slice(7, 14);

  if (previous.length < 3) {
    return {
      responseRateImproving: false,
      triggerOccurrenceDecreasing: false,
      difficultyDecreasing: false,
    };
  }

  // Response rate comparison
  const recentTriggered = recent.filter(c => c.triggerOccurred);
  const previousTriggered = previous.filter(c => c.triggerOccurred);

  const recentResponseRate = recentTriggered.length > 0
    ? recentTriggered.filter(c => c.actionTaken).length / recentTriggered.length
    : 0;
  const previousResponseRate = previousTriggered.length > 0
    ? previousTriggered.filter(c => c.actionTaken).length / previousTriggered.length
    : 0;

  // Trigger occurrence comparison
  const recentTriggerRate = recent.filter(c => c.triggerOccurred).length / recent.length;
  const previousTriggerRate = previous.filter(c => c.triggerOccurred).length / previous.length;

  // Difficulty comparison
  const recentWithDiff = recent.filter(c => c.difficultyRating);
  const previousWithDiff = previous.filter(c => c.difficultyRating);

  const recentDiffAvg = recentWithDiff.length > 0
    ? recentWithDiff.reduce((acc, c) => acc + (c.difficultyRating || 3), 0) / recentWithDiff.length
    : 3;
  const previousDiffAvg = previousWithDiff.length > 0
    ? previousWithDiff.reduce((acc, c) => acc + (c.difficultyRating || 3), 0) / previousWithDiff.length
    : 3;

  return {
    responseRateImproving: recentResponseRate > previousResponseRate + 0.1,
    triggerOccurrenceDecreasing: recentTriggerRate < previousTriggerRate - 0.1,
    difficultyDecreasing: recentDiffAvg < previousDiffAvg - 0.3,
  };
}

/**
 * Calculate outcome success rate (for reactive habits)
 */
function calculateOutcomeSuccessRate(checkIns: CheckIn[]): number {
  const withOutcome = checkIns.filter(c => c.outcomeSuccess !== undefined);

  if (withOutcome.length === 0) {
    return 0;
  }

  return withOutcome.filter(c => c.outcomeSuccess).length / withOutcome.length;
}

/**
 * Get a brief summary of current patterns for display
 */
export function getPatternSummary(patterns: CheckInPatterns): string[] {
  const summaries: string[] = [];

  if (patterns.currentStreak >= 3) {
    summaries.push(`${patterns.currentStreak} in a row`);
  }

  if (patterns.responseRateWhenTriggered >= 0.8 && patterns.totalCheckIns >= 5) {
    summaries.push(`${Math.round(patterns.responseRateWhenTriggered * 100)}% follow-through`);
  }

  if (patterns.weakDays.length > 0) {
    summaries.push(`${patterns.weakDays.join(', ')} need attention`);
  }

  if (patterns.difficultyTrend === 'decreasing') {
    summaries.push('Getting easier');
  }

  return summaries;
}
