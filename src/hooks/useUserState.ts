'use client';

import { useMemo } from 'react';
import { HabitData } from '@/types/habit';
import { getLocalDateString, getYesterdayDateString } from '@/lib/dateUtils';
import { needsReentry } from '@/lib/store/habitStore';

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
  | 'needs_tuneup'       // Completed first rep, tune-up available
  | 'needs_reentry';     // Inactive 7+ days, welcome-back flow

/**
 * Check if user missed yesterday
 */
function didMissYesterday(habitData: HabitData): boolean {
  if (!habitData.lastDoneDate) return false;

  const yesterdayStr = getYesterdayDateString();

  // Check if yesterday specifically has a check-in (not just date comparison)
  const hasYesterdayCheckIn = habitData.checkIns?.some(c => c.date === yesterdayStr);
  if (hasYesterdayCheckIn) return false; // They logged yesterday, even if it was a miss

  // If last done is before yesterday and no check-in exists for yesterday
  return habitData.lastDoneDate < yesterdayStr;
}

/**
 * Check if user completed today
 */
function didCompleteToday(habitData: HabitData): boolean {
  if (!habitData.lastDoneDate) return false;
  return habitData.lastDoneDate === getLocalDateString();
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

  // Check for reentry (7+ days inactive) — before missed_yesterday
  if (needsReentry()) {
    return 'needs_reentry';
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
      return '/'; // Handled by backfill disambiguation on home screen
    case 'needs_reentry':
      return '/'; // Welcome-back flow on home screen
    case 'needs_tuneup':
    case 'active_today':
    case 'completed_today':
    default:
      return '/'; // Home/Plan screen
  }
}
