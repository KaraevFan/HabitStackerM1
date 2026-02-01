import { useMemo } from 'react';
import { HabitData } from '@/types/habit';
import { analyzePatterns, CheckInPatterns } from '@/lib/patterns/patternFinder';

/**
 * Hook to analyze check-in patterns from habit data
 * Memoized to avoid recalculating on every render
 */
export function useCheckInPatterns(habitData: HabitData | null): CheckInPatterns | null {
  return useMemo(() => {
    if (!habitData?.checkIns || habitData.checkIns.length === 0) {
      return null;
    }

    const habitType = habitData.system?.habitType || 'time_anchored';
    return analyzePatterns(habitData.checkIns, habitType);
  }, [habitData?.checkIns, habitData?.system?.habitType]);
}

/**
 * Hook to get patterns with loading state
 * Useful when habitData might be loading
 */
export function useCheckInPatternsWithLoading(
  habitData: HabitData | null,
  isLoading: boolean
): { patterns: CheckInPatterns | null; isAnalyzing: boolean } {
  const patterns = useCheckInPatterns(habitData);

  return {
    patterns,
    isAnalyzing: isLoading && !patterns,
  };
}
