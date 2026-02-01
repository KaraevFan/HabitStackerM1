'use client';

import { useMemo } from 'react';
import { HabitData } from '@/types/habit';

/**
 * User lifecycle states for routing
 */
export type UserState =
  | 'new_user'           // No habit data → Landing page
  | 'mid_conversation'   // Has intake state but not complete → Resume conversation
  | 'system_designed'    // Designed but no reps yet → "Ready to start" prompt
  | 'active_today'       // Has habit, ready for today's action
  | 'completed_today'    // Already did today's rep
  | 'missed_yesterday'   // Missed yesterday, needs recovery
  | 'needs_tuneup';      // Completed first rep, tune-up available

/**
 * Check if user missed yesterday
 */
function didMissYesterday(habitData: HabitData): boolean {
  if (!habitData.lastDoneDate) return false;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastDone = habitData.lastDoneDate;

  // If last done was before yesterday, they missed
  return lastDone < yesterdayStr;
}

/**
 * Check if user completed today
 */
function didCompleteToday(habitData: HabitData): boolean {
  if (!habitData.lastDoneDate) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return habitData.lastDoneDate === todayStr;
}

/**
 * Determine user state from habit data
 */
export function getUserState(habitData: HabitData | null): UserState {
  // No data at all → new user
  if (!habitData) {
    return 'new_user';
  }

  // In install state with no system → new user
  if (habitData.state === 'install' && !habitData.system && !habitData.planDetails) {
    return 'new_user';
  }

  // Has intake state that's not complete → mid conversation
  // Type guard for intakeState (typed as unknown in HabitData)
  const intakeState = habitData.intakeState as { isComplete?: boolean } | undefined;
  if (intakeState && !intakeState.isComplete) {
    return 'mid_conversation';
  }

  // System designed but no reps yet
  if (habitData.state === 'designed' ||
      (habitData.system && habitData.repsCount === 0)) {
    return 'system_designed';
  }

  // Check for missed state
  if (habitData.state === 'missed' || didMissYesterday(habitData)) {
    return 'missed_yesterday';
  }

  // Check if completed today
  if (didCompleteToday(habitData)) {
    return 'completed_today';
  }

  // Check for tune-up availability (first rep done but not tuned)
  if (habitData.repsCount === 1 && habitData.state === 'active') {
    return 'needs_tuneup';
  }

  // Default: active and ready for today
  return 'active_today';
}

/**
 * Hook to determine current user state
 * Returns the state and whether we're still loading
 */
export function useUserState(habitData: HabitData | null, isLoading: boolean): {
  userState: UserState;
  isLoading: boolean;
} {
  const userState = useMemo(() => getUserState(habitData), [habitData]);

  return {
    userState,
    isLoading,
  };
}

/**
 * Get the recommended route for a user state
 */
export function getRouteForState(state: UserState): string {
  switch (state) {
    case 'new_user':
      return '/'; // Shows landing page
    case 'mid_conversation':
      return '/setup'; // Resume conversation
    case 'system_designed':
      return '/'; // Shows "Ready to start" prompt
    case 'missed_yesterday':
      return '/recovery';
    case 'needs_tuneup':
    case 'active_today':
    case 'completed_today':
    default:
      return '/'; // Home/Plan screen
  }
}
