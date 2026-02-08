import { useMemo } from 'react';
import { HabitData, CheckIn, getCheckInState } from '@/types/habit';

export type ReflectionType = 'weekly' | 'recovery' | null;

interface ReflectionTriggerResult {
  shouldShowReflection: boolean;
  reflectionType: ReflectionType;
  daysSinceCreation: number;
  consecutiveMisses: number;
  lastReflectionDate: string | null;
  weekNumber: number;
}

/**
 * Hook to determine if weekly/recovery reflection should be shown
 */
export function useReflectionTrigger(
  habitData: HabitData | null
): ReflectionTriggerResult {
  return useMemo(() => {
    if (!habitData || !habitData.createdAt) {
      return {
        shouldShowReflection: false,
        reflectionType: null,
        daysSinceCreation: 0,
        consecutiveMisses: 0,
        lastReflectionDate: null,
        weekNumber: 0,
      };
    }

    const checkIns = habitData.checkIns || [];
    const now = new Date();
    const createdAt = new Date(habitData.createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.floor(daysSinceCreation / 7);

    // Get last reflection date from habit data
    const lastReflectionDate = habitData.lastReflectionDate || null;

    // Check for consecutive misses (3+ triggers recovery reflection)
    const consecutiveMisses = countConsecutiveMisses(checkIns);

    // Recovery reflection: 3+ consecutive misses
    if (consecutiveMisses >= 3) {
      return {
        shouldShowReflection: true,
        reflectionType: 'recovery',
        daysSinceCreation,
        consecutiveMisses,
        lastReflectionDate,
        weekNumber,
      };
    }

    // Weekly reflection: 7+ days since creation and hasn't reflected this week
    if (daysSinceCreation >= 7) {
      const hasReflectedThisWeek = lastReflectionDate
        ? isWithinLastWeek(lastReflectionDate)
        : false;

      if (!hasReflectedThisWeek) {
        return {
          shouldShowReflection: true,
          reflectionType: 'weekly',
          daysSinceCreation,
          consecutiveMisses,
          lastReflectionDate,
          weekNumber,
        };
      }
    }

    return {
      shouldShowReflection: false,
      reflectionType: null,
      daysSinceCreation,
      consecutiveMisses,
      lastReflectionDate,
      weekNumber,
    };
  }, [habitData]);
}

/**
 * Count consecutive misses from most recent check-ins
 */
function countConsecutiveMisses(checkIns: CheckIn[]): number {
  // Sort by date descending (most recent first)
  const sorted = [...checkIns].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let misses = 0;
  for (const checkIn of sorted) {
    const state = getCheckInState(checkIn);
    if (state === 'missed') {
      misses++;
    } else if (state === 'completed' || state === 'recovered') {
      break; // Streak of misses broken
    }
    // no_trigger doesn't count as miss or break the pattern
  }

  return misses;
}

/**
 * Check if a date string is within the last 7 days
 */
function isWithinLastWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
}

/**
 * Get the appropriate reflection prompt based on type
 */
export function getReflectionPrompt(
  reflectionType: ReflectionType,
  daysSinceCreation: number,
  consecutiveMisses: number
): { title: string; subtitle: string } {
  if (reflectionType === 'recovery') {
    return {
      title: `${consecutiveMisses} misses in a row`,
      subtitle: "Let's figure out what's going on.",
    };
  }

  if (reflectionType === 'weekly') {
    const weekNumber = Math.floor(daysSinceCreation / 7);
    return {
      title: `Week ${weekNumber} complete`,
      subtitle: "Time for a quick check-in.",
    };
  }

  return {
    title: 'Reflection',
    subtitle: 'How is it going?',
  };
}

/**
 * Check if it's time for a reflection prompt
 * Can be used outside of React context
 */
export function shouldTriggerReflection(habitData: HabitData): ReflectionType {
  if (!habitData || !habitData.createdAt) {
    return null;
  }

  const checkIns = habitData.checkIns || [];
  const now = new Date();
  const createdAt = new Date(habitData.createdAt);
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check for consecutive misses
  const consecutiveMisses = countConsecutiveMisses(checkIns);
  if (consecutiveMisses >= 3) {
    return 'recovery';
  }

  // Check for weekly reflection
  const lastReflectionDate = habitData.lastReflectionDate;
  if (daysSinceCreation >= 7) {
    const hasReflectedThisWeek = lastReflectionDate
      ? isWithinLastWeek(lastReflectionDate)
      : false;

    if (!hasReflectedThisWeek) {
      return 'weekly';
    }
  }

  return null;
}
