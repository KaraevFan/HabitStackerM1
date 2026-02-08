import { loadHabitData, updateHabitData } from './habitStore';

export type SystemUpdateField = 'anchor' | 'action' | 'tiny_version' | 'recovery' | 'timing' | 'none';

export interface SystemUpdate {
  field: SystemUpdateField;
  newValue: string;
  source: 'weekly_reflection' | 'recovery_reflection' | 'pattern_suggestion' | 'on_demand' | 'manual';
  reason?: string;
}

export interface SystemUpdateResult {
  success: boolean;
  previousValue: string | undefined;
  newValue: string;
  field: SystemUpdateField;
}

/**
 * Apply a system update to the habit system
 * Handles: anchor, action, tiny_version, recovery, timing, none
 * Bumps tuneCount and tunedAt on every mutation
 */
export function applySystemUpdate(update: SystemUpdate): SystemUpdateResult {
  if (update.field === 'none') {
    return {
      success: true,
      previousValue: undefined,
      newValue: update.newValue,
      field: 'none',
    };
  }

  const current = loadHabitData();
  if (!current.system) {
    return {
      success: false,
      previousValue: undefined,
      newValue: update.newValue,
      field: update.field,
    };
  }

  const system = { ...current.system };
  let previousValue: string | undefined;

  switch (update.field) {
    case 'anchor':
      previousValue = system.anchor;
      system.anchor = update.newValue;
      break;
    case 'action':
      previousValue = system.action;
      system.action = update.newValue;
      break;
    case 'tiny_version':
      previousValue = system.tinyVersion;
      system.tinyVersion = update.newValue;
      break;
    case 'recovery':
      previousValue = system.recovery;
      system.recovery = update.newValue;
      break;
    case 'timing':
      // Use anchorTime for time-anchored, checkInTime for reactive
      if (system.habitType === 'reactive') {
        previousValue = system.checkInTime;
        system.checkInTime = update.newValue;
      } else {
        previousValue = system.anchorTime;
        system.anchorTime = update.newValue;
      }
      break;
  }

  // Bump tune metadata
  system.tunedAt = new Date().toISOString();
  system.tuneCount = (system.tuneCount || 0) + 1;

  updateHabitData({ system });

  return {
    success: true,
    previousValue,
    newValue: update.newValue,
    field: update.field,
  };
}
