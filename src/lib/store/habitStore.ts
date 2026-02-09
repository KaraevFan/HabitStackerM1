import {
  HabitData,
  DayMemory,
  RepEvent,
  RepLog,
  HabitSystem,
  CheckIn,
  CheckInState,
  createInitialHabitData,
  ConsultStep,
  PlanDetails,
  HabitSnapshot,
  generateRepLogId,
  generateCheckInId,
  getCheckInState,
  WeeklyReflection,
  PatternSnapshot,
} from "@/types/habit";
import { getLocalDateString } from "@/lib/dateUtils";

// Sync layer hook — registered by Supabase sync on app init
type SaveHook = (data: HabitData) => void;
let _onSaveHook: SaveHook | null = null;
export function setOnSaveHook(hook: SaveHook | null): void { _onSaveHook = hook; }

const STORAGE_KEY = "habit-stacker-data";
const BACKUP_KEY = "habit-stacker-data-backup";
const BACKUP_TIMESTAMP_KEY = "habit-stacker-backup-timestamp";

/**
 * Load habit data from localStorage
 */
export function loadHabitData(): HabitData {
  if (typeof window === "undefined") {
    return createInitialHabitData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.state) return parsed as HabitData;
    }

    // Primary is empty or invalid — check backup
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsedBackup = JSON.parse(backup);
      if (parsedBackup && parsedBackup.state) {
        // Flag that we need to prompt the user
        return { ...parsedBackup, _needsRestoreConfirmation: true } as HabitData;
      }
    }

    return createInitialHabitData();
  } catch {
    // Parse failure — try backup
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (parsedBackup && parsedBackup.state) {
          return { ...parsedBackup, _needsRestoreConfirmation: true } as HabitData;
        }
      }
    } catch {
      // Both corrupted
    }
    console.error("Failed to load habit data from localStorage");
    return createInitialHabitData();
  }
}

/**
 * Save habit data to localStorage
 */
export function saveHabitData(data: HabitData): void {
  if (typeof window === "undefined") return;

  try {
    // Backup current state BEFORE overwriting
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      localStorage.setItem(BACKUP_KEY, existing);
      localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
    }

    // Strip restore flag before saving
    const { _needsRestoreConfirmation, ...cleanData } = data as HabitData & { _needsRestoreConfirmation?: boolean };
    const updated = { ...cleanData, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Notify sync layer
    if (_onSaveHook) {
      try { _onSaveHook(updated); } catch { /* sync failures don't break saves */ }
    }
  } catch (error) {
    console.error("Failed to save habit data to localStorage", error);
    throw new Error('Failed to save your data. Your browser storage may be full.');
  }
}

/**
 * Update specific fields in habit data
 */
export function updateHabitData(updates: Partial<HabitData>): HabitData {
  const current = loadHabitData();
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  saveHabitData(updated);
  return updated;
}

/**
 * Log a rep event
 */
export function logEvent(type: RepEvent["type"], note?: string): HabitData {
  const current = loadHabitData();
  const event: RepEvent = {
    type,
    timestamp: new Date().toISOString(),
    note,
  };

  const updates: Partial<HabitData> = {
    events: [...current.events, event],
    lastActiveDate: new Date().toISOString(),
  };

  // Update state and counts based on event type
  if (type === "rep_done") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = getLocalDateString();
    updates.state = "active";
    updates.missedDate = null;
  } else if (type === "miss") {
    updates.state = "missed";
    updates.missedDate = getLocalDateString();
  } else if (type === "recovery_done") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = getLocalDateString();
    updates.state = "active";
    updates.missedDate = null;
  } else if (type === "skip") {
    // Skip preserves missed state but logs the event
    updates.state = "missed";
  }

  return updateHabitData(updates);
}

/**
 * Update consult step progress
 */
export function setConsultStep(step: ConsultStep | null): HabitData {
  return updateHabitData({ currentConsultStep: step });
}

/**
 * Save consult selection for a step
 */
export function saveConsultSelection<K extends keyof HabitData["consultSelections"]>(
  step: K,
  value: HabitData["consultSelections"][K]
): HabitData {
  const current = loadHabitData();
  return updateHabitData({
    consultSelections: { ...current.consultSelections, [step]: value },
  });
}

/**
 * Complete the consult and set up the habit
 */
export function completeConsult(
  planDetails: PlanDetails,
  snapshot: HabitSnapshot
): HabitData {
  return updateHabitData({
    state: "designed",
    currentConsultStep: null,
    planDetails,
    snapshot,
  });
}

/**
 * Transition state after first rep
 */
export function activateHabit(): HabitData {
  return updateHabitData({ state: "active" });
}

/**
 * Reset all data (for testing or user reset)
 */
export function resetHabitData(): HabitData {
  const initial = createInitialHabitData();
  saveHabitData(initial);
  return initial;
}

/**
 * Export habit data as JSON string (for manual download)
 */
export function exportHabitData(): string {
  const data = loadHabitData();
  return JSON.stringify(data, null, 2);
}

/**
 * Restore data from backup key
 */
export function restoreFromBackup(): HabitData | null {
  if (typeof window === "undefined") return null;
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return null;
    const parsed = JSON.parse(backup);
    if (parsed && parsed.state) {
      localStorage.setItem(STORAGE_KEY, backup);
      return parsed as HabitData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear backup and restore flag (user chose "Start fresh")
 */
export function clearBackup(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BACKUP_KEY);
  localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
}

/**
 * Get backup timestamp if backup exists
 */
export function getBackupTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BACKUP_TIMESTAMP_KEY);
}

/**
 * Check if user needs re-entry flow (inactive for 7+ days)
 */
export function needsReentry(): boolean {
  const data = loadHabitData();
  if (!data.lastActiveDate) return false;

  const lastActive = new Date(data.lastActiveDate);
  const now = new Date();
  const daysSinceActive = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceActive >= 7;
}

/**
 * Check if user is in missed state requiring recovery
 */
export function needsRecovery(): boolean {
  const data = loadHabitData();
  return data.state === "missed";
}

/**
 * @deprecated Use logCheckIn() instead. This function writes to the legacy repLogs array.
 * Kept temporarily for any remaining old code paths.
 */
export function logRep(
  type: RepLog["type"],
  photoUri?: string,
  photoSkipped?: boolean
): HabitData {
  const current = loadHabitData();

  const repLog: RepLog = {
    id: generateRepLogId(),
    timestamp: new Date().toISOString(),
    type,
    photoUri,
    photoSkipped,
  };

  const repLogs = [...(current.repLogs || []), repLog];

  const updates: Partial<HabitData> = {
    repLogs,
    lastActiveDate: new Date().toISOString(),
  };

  // Update state and counts based on rep type
  if (type === "done") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = getLocalDateString();
    updates.state = "active";
    updates.missedDate = null;

    // Track first rep with photo
    if (photoUri && !current.hasCompletedFirstRepWithPhoto) {
      updates.hasCompletedFirstRepWithPhoto = true;
    }
  } else if (type === "missed") {
    updates.state = "missed";
    updates.missedDate = getLocalDateString();
  } else if (type === "recovery") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = getLocalDateString();
    updates.state = "active";
    updates.missedDate = null;
  }

  // Also log to legacy events for backwards compatibility
  const legacyEventType: RepEvent["type"] =
    type === "done" ? "rep_done" :
    type === "recovery" ? "recovery_done" : "miss";

  updates.events = [...current.events, {
    type: legacyEventType,
    timestamp: new Date().toISOString(),
  }];

  return updateHabitData(updates);
}

/**
 * Update photo for a rep log
 */
export function updateRepPhoto(repLogId: string, photoUri: string): HabitData {
  const current = loadHabitData();
  const repLogs = current.repLogs?.map((rep) =>
    rep.id === repLogId ? { ...rep, photoUri, photoSkipped: false } : rep
  ) || [];

  const updates: Partial<HabitData> = { repLogs };

  // Track first rep with photo if not already set
  if (!current.hasCompletedFirstRepWithPhoto) {
    updates.hasCompletedFirstRepWithPhoto = true;
  }

  return updateHabitData(updates);
}

/**
 * Save habit system from intake agent (R8)
 */
export function saveHabitSystem(system: HabitSystem): HabitData {
  return updateHabitData({ system });
}

/**
 * Update habit system toolkit from tune-up conversation
 */
export function updateSystemToolkit(toolkit: {
  tinyVersion?: string;
  environmentPrime?: string;
  frictionReduced?: string;
}): HabitData {
  const current = loadHabitData();
  const system: HabitSystem = {
    ...current.system!,
    ...toolkit,
    tunedAt: new Date().toISOString(),
    tuneCount: (current.system?.tuneCount || 0) + 1,
  };
  return updateHabitData({ system });
}

/**
 * Save felt understood rating from confirmation screen
 */
export function saveFeltUnderstoodRating(rating: number): HabitData {
  return updateHabitData({ feltUnderstoodRating: rating });
}

/**
 * Toggle setup checklist item completion (V0.5)
 */
export function toggleSetupItem(itemId: string): HabitData {
  const current = loadHabitData();
  if (!current.system?.setupChecklist) return current;

  const setupChecklist = current.system.setupChecklist.map((item) =>
    item.id === itemId ? { ...item, completed: !item.completed } : item
  );

  const system: HabitSystem = {
    ...current.system,
    setupChecklist,
  };

  return updateHabitData({ system });
}

/**
 * Mark setup checklist item as not applicable (V0.5)
 */
export function markSetupItemNA(itemId: string): HabitData {
  const current = loadHabitData();
  if (!current.system?.setupChecklist) return current;

  const setupChecklist = current.system.setupChecklist.map((item) =>
    item.id === itemId ? { ...item, notApplicable: !item.notApplicable, completed: false } : item
  );

  const system: HabitSystem = {
    ...current.system,
    setupChecklist,
  };

  return updateHabitData({ system });
}

// ============================================
// LOGGING SYSTEM FUNCTIONS
// ============================================

/**
 * Log a check-in for today
 *
 * This is the PRIMARY way to log habit completions/misses.
 * All habits (time-anchored, event-anchored, reactive) use this function.
 * For time/event habits, triggerOccurred defaults to true.
 */
export function logCheckIn(
  checkInData: Omit<CheckIn, 'id' | 'checkedInAt'>,
  dateOverride?: string  // YYYY-MM-DD, defaults to getLocalDateString()
): HabitData {
  // Atomic read-modify-write: load fresh data, mutate checkIns, save in one shot.
  // This avoids race conditions where a stale checkIns array overwrites newer data.
  const current = loadHabitData();
  const today = dateOverride || getLocalDateString();
  const currentCheckIns = current.checkIns || [];

  // Guard: if target date already has a check-in, update it instead of creating a duplicate
  const existingToday = currentCheckIns.find(c => c.date === today);

  let checkIns: CheckIn[];
  let checkInState: string;

  if (existingToday) {
    checkIns = currentCheckIns.map(c =>
      c.id === existingToday.id ? { ...c, ...checkInData, date: today } : c
    );
    checkInState = getCheckInState({ ...existingToday, ...checkInData });
  } else {
    const checkIn: CheckIn = {
      ...checkInData,
      id: generateCheckInId(),
      checkedInAt: new Date().toISOString(),
      date: today,
    };
    checkIns = [...currentCheckIns, checkIn];
    checkInState = getCheckInState(checkIn);
  }

  // Build a complete updated object and save directly (no second load)
  const updated: HabitData = {
    ...current,
    checkIns,
    lastActiveDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (checkInState === 'completed' || checkInState === 'recovered') {
    updated.repsCount = current.repsCount + 1;
    updated.lastDoneDate = today;
    updated.state = 'active';
    updated.missedDate = null;
  } else if (checkInState === 'missed') {
    updated.state = 'missed';
    updated.missedDate = today;
  }
  // 'no_trigger' doesn't change state/counts but is still valuable data

  saveHabitData(updated);
  return updated;
}

/**
 * Get today's check-in if it exists
 */
export function getTodayCheckIn(): CheckIn | null {
  const current = loadHabitData();
  const today = getLocalDateString();
  return current.checkIns?.find((c) => c.date === today) || null;
}

/**
 * Get today's check-in state
 */
export function getTodayCheckInState(): CheckInState {
  const checkIn = getTodayCheckIn();
  if (!checkIn) return 'pending';
  return getCheckInState(checkIn);
}

/**
 * Get check-ins for the last N days
 */
export function getRecentCheckIns(days: number = 7): CheckIn[] {
  const current = loadHabitData();
  if (!current.checkIns) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = getLocalDateString(cutoffDate);

  return current.checkIns
    .filter((c) => c.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get check-ins for current week (last 7 days)
 */
export function getWeekCheckIns(): CheckIn[] {
  return getRecentCheckIns(7);
}

/**
 * Accept recovery offer (mark recovery as accepted)
 */
export function acceptRecovery(): HabitData {
  const current = loadHabitData();
  const today = getLocalDateString();

  // Find today's check-in
  const checkIns = current.checkIns?.map((c) =>
    c.date === today ? { ...c, recoveryAccepted: true } : c
  ) || [];

  return updateHabitData({ checkIns });
}

/**
 * Complete recovery action
 */
export function completeRecovery(): HabitData {
  const current = loadHabitData();
  const today = getLocalDateString();

  // Find today's check-in and mark recovery completed
  const checkIns = current.checkIns?.map((c) =>
    c.date === today ? { ...c, recoveryCompleted: true } : c
  ) || [];

  // Update state
  const updates: Partial<HabitData> = {
    checkIns,
    state: 'active',
    missedDate: null,
    repsCount: current.repsCount + 1,
    lastDoneDate: today,
  };

  return updateHabitData(updates);
}

/**
 * Update today's check-in with additional data (e.g., difficulty rating)
 */
export function updateTodayCheckIn(
  updates: Partial<Pick<CheckIn, 'difficultyRating' | 'note' | 'outcomeSuccess' | 'missReason' | 'systemChangeProposed'>>
): HabitData {
  const current = loadHabitData();
  const today = getLocalDateString();

  const checkIns = current.checkIns?.map((c) =>
    c.date === today ? { ...c, ...updates } : c
  ) || [];

  return updateHabitData({ checkIns });
}

/**
 * Get count of check-ins by state for a period
 */
export function getCheckInStats(days: number = 7): {
  completed: number;
  missed: number;
  noTrigger: number;
  recovered: number;
  total: number;
} {
  const checkIns = getRecentCheckIns(days);

  const stats = {
    completed: 0,
    missed: 0,
    noTrigger: 0,
    recovered: 0,
    total: checkIns.length,
  };

  for (const checkIn of checkIns) {
    const state = getCheckInState(checkIn);
    if (state === 'completed') stats.completed++;
    else if (state === 'missed') stats.missed++;
    else if (state === 'no_trigger') stats.noTrigger++;
    else if (state === 'recovered') stats.recovered++;
  }

  return stats;
}

/**
 * Update check-in conversation data (V0.6)
 */
export function updateCheckInConversation(
  checkInId: string,
  conversation: {
    messages?: Array<{ role: 'ai' | 'user'; content: string }>;
    skipped?: boolean;
    duration?: number;
  }
): HabitData {
  const current = loadHabitData();

  const checkIns = current.checkIns?.map((c) =>
    c.id === checkInId
      ? {
          ...c,
          conversation: {
            messages: conversation.messages || c.conversation?.messages || [],
            skipped: conversation.skipped ?? c.conversation?.skipped ?? false,
            duration: conversation.duration ?? c.conversation?.duration ?? 0,
          },
        }
      : c
  ) || [];

  return updateHabitData({ checkIns });
}

// ============================================
// BACKFILL FUNCTIONS
// ============================================

/**
 * Recalculate repsCount and lastDoneDate from all check-ins.
 * Used after backfill to ensure consistency.
 */
function recalculateStats(checkIns: CheckIn[]): { repsCount: number; lastDoneDate: string | null } {
  let repsCount = 0;
  let lastDoneDate: string | null = null;

  for (const checkIn of checkIns) {
    const state = getCheckInState(checkIn);
    if (state === 'completed' || state === 'recovered') {
      repsCount++;
      if (!lastDoneDate || checkIn.date > lastDoneDate) {
        lastDoneDate = checkIn.date;
      }
    }
  }

  return { repsCount, lastDoneDate };
}

/**
 * Log or update a check-in for a specific date (backfill).
 * Unlike logCheckIn(), this takes an explicit date and recalculates stats
 * from all check-ins rather than incrementing.
 * Only touches habit state if backfilling today.
 */
export function logBackfillCheckIn(
  date: string,
  checkInData: Partial<Pick<CheckIn, 'triggerOccurred' | 'actionTaken' | 'note' | 'difficulty' | 'difficultyRating' | 'missReason'>>
): HabitData {
  const current = loadHabitData();
  const today = getLocalDateString();
  const currentCheckIns = current.checkIns || [];

  const existing = currentCheckIns.find(c => c.date === date);

  let checkIns: CheckIn[];

  if (existing) {
    // Merge into existing check-in
    checkIns = currentCheckIns.map(c =>
      c.id === existing.id ? { ...c, ...checkInData } : c
    );
  } else {
    // Create new check-in for that date
    const newCheckIn: CheckIn = {
      id: generateCheckInId(),
      checkedInAt: new Date().toISOString(),
      date,
      triggerOccurred: checkInData.triggerOccurred ?? true,
      actionTaken: checkInData.actionTaken ?? false,
      recoveryOffered: false,
      note: checkInData.note,
      difficulty: checkInData.difficulty,
      difficultyRating: checkInData.difficultyRating,
      missReason: checkInData.missReason,
    };
    checkIns = [...currentCheckIns, newCheckIn];
  }

  // Recalculate stats from all check-ins
  const stats = recalculateStats(checkIns);

  const updated: HabitData = {
    ...current,
    checkIns,
    repsCount: stats.repsCount,
    lastDoneDate: stats.lastDoneDate,
    lastActiveDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Only touch habit state if backfilling today
  if (date === today) {
    const todayCheckIn = checkIns.find(c => c.date === today);
    if (todayCheckIn) {
      const state = getCheckInState(todayCheckIn);
      if (state === 'completed' || state === 'recovered') {
        updated.state = 'active';
        updated.missedDate = null;
      } else if (state === 'missed') {
        updated.state = 'missed';
        updated.missedDate = today;
      }
    }
  }

  saveHabitData(updated);
  return updated;
}

// ============================================
// REFLECTION SYSTEM FUNCTIONS (R18)
// ============================================

/**
 * Save a weekly/recovery reflection
 */
export function saveReflection(reflection: WeeklyReflection): HabitData {
  const current = loadHabitData();

  // Compute next reflection due (7 days from now)
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + 7);

  // Atomic save — don't go through updateHabitData to avoid stale array overwrite
  const updated: HabitData = {
    ...current,
    reflections: [...(current.reflections || []), reflection],
    lastReflectionDate: new Date().toISOString(),
    nextReflectionDue: nextDue.toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveHabitData(updated);
  return updated;
}

// ============================================
// PATTERN CACHING FUNCTIONS (R18)
// ============================================

/**
 * Save a pattern snapshot to cache
 */
export function savePatternSnapshot(snapshot: PatternSnapshot): HabitData {
  const current = loadHabitData();

  // Atomic save — don't go through updateHabitData to avoid stale array overwrite
  const updated: HabitData = {
    ...current,
    patternHistory: [...(current.patternHistory || []), snapshot],
    latestPatternGeneratedAt: snapshot.generatedAt,
    updatedAt: new Date().toISOString(),
  };
  saveHabitData(updated);
  return updated;
}

/**
 * Get latest cached pattern snapshot
 */
export function getLatestPatternSnapshot(): PatternSnapshot | null {
  const current = loadHabitData();
  const history = current.patternHistory || [];
  return history.length > 0 ? history[history.length - 1] : null;
}

/**
 * Check if patterns should be regenerated
 * True if: >7 days since last generation, or significant check-in count change (3+)
 */
export function shouldRegeneratePatterns(): boolean {
  const current = loadHabitData();
  const lastGenerated = current.latestPatternGeneratedAt;
  const lastSnapshot = getLatestPatternSnapshot();

  if (!lastGenerated || !lastSnapshot) return true;

  // More than 7 days since last generation
  const daysSince = Math.floor(
    (Date.now() - new Date(lastGenerated).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince >= 7) return true;

  // Significant check-in count change (3+ new check-ins)
  const currentCheckInCount = current.checkIns?.length || 0;
  if (currentCheckInCount - lastSnapshot.checkInCount >= 3) return true;

  return false;
}

// ============================================
// GRADUATION FUNCTIONS (R18)
// ============================================

/**
 * Skip recovery and restore active state.
 * Used by recovery escape hatch and backfill disambiguation.
 */
export function skipRecovery(): HabitData {
  return updateHabitData({
    state: 'active',
    missedDate: null,
  });
}

/**
 * Graduate current habit to maintained state
 */
export function graduateHabit(): HabitData {
  return updateHabitData({
    state: 'maintained',
    graduatedAt: new Date().toISOString(),
  });
}

/**
 * Pause current habit
 */
export function pauseHabit(reason: string, reentryPlan?: string): HabitData {
  return updateHabitData({
    state: 'paused',
    pausedAt: new Date().toISOString(),
    pauseReason: reason,
    reentryPlan,
  });
}

/**
 * Update today's check-in conversation (V0.6)
 */
export function updateTodayConversation(
  conversation: {
    messages?: Array<{ role: 'ai' | 'user'; content: string }>;
    skipped?: boolean;
    duration?: number;
    reflection?: {
      summary: string;
      quantitative?: string;
      sentiment?: 'positive' | 'neutral' | 'challenging';
      frictionNote?: string;
    };
  }
): HabitData {
  const current = loadHabitData();
  const today = getLocalDateString();

  const checkIns = current.checkIns?.map((c) =>
    c.date === today
      ? {
          ...c,
          conversation: {
            messages: conversation.messages || c.conversation?.messages || [],
            skipped: conversation.skipped ?? c.conversation?.skipped ?? false,
            duration: conversation.duration ?? c.conversation?.duration ?? 0,
          },
          // Store AI-extracted reflection summary
          reflection: conversation.reflection || c.reflection,
        }
      : c
  ) || [];

  return updateHabitData({ checkIns });
}

// ============================================
// DAY MEMORY FUNCTIONS (R19)
// ============================================

/**
 * Save a DayMemory entry
 */
export function saveDayMemory(memory: DayMemory): HabitData {
  const current = loadHabitData();
  const existing = current.dayMemories || [];

  // Replace if same date exists, otherwise append
  const idx = existing.findIndex(m => m.date === memory.date);
  let dayMemories: DayMemory[];
  if (idx >= 0) {
    dayMemories = [...existing];
    dayMemories[idx] = memory;
  } else {
    dayMemories = [...existing, memory];
  }

  const updated: HabitData = {
    ...current,
    dayMemories,
    updatedAt: new Date().toISOString(),
  };
  saveHabitData(updated);
  return updated;
}
