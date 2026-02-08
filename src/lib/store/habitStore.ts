import {
  HabitData,
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

const STORAGE_KEY = "habit-stacker-data";

/**
 * Load habit data from localStorage
 */
export function loadHabitData(): HabitData {
  if (typeof window === "undefined") {
    return createInitialHabitData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialHabitData();
    }
    return JSON.parse(stored) as HabitData;
  } catch {
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
    const updated = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save habit data to localStorage", error);
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
    updates.lastDoneDate = new Date().toISOString().split("T")[0];
    updates.state = "active";
    updates.missedDate = null;
  } else if (type === "miss") {
    updates.state = "missed";
    updates.missedDate = new Date().toISOString().split("T")[0];
  } else if (type === "recovery_done") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = new Date().toISOString().split("T")[0];
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
    updates.lastDoneDate = new Date().toISOString().split("T")[0];
    updates.state = "active";
    updates.missedDate = null;

    // Track first rep with photo
    if (photoUri && !current.hasCompletedFirstRepWithPhoto) {
      updates.hasCompletedFirstRepWithPhoto = true;
    }
  } else if (type === "missed") {
    updates.state = "missed";
    updates.missedDate = new Date().toISOString().split("T")[0];
  } else if (type === "recovery") {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = new Date().toISOString().split("T")[0];
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
  checkInData: Omit<CheckIn, 'id' | 'checkedInAt'>
): HabitData {
  const current = loadHabitData();
  const today = new Date().toISOString().split('T')[0];

  // Guard: if today already has a check-in, update it instead of creating a duplicate
  const existingToday = (current.checkIns || []).find(c => c.date === today);
  if (existingToday) {
    const checkIns = (current.checkIns || []).map(c =>
      c.id === existingToday.id ? { ...c, ...checkInData, date: today } : c
    );
    const state = getCheckInState({ ...existingToday, ...checkInData });
    const updates: Partial<HabitData> = {
      checkIns,
      lastActiveDate: new Date().toISOString(),
    };
    if (state === 'completed' || state === 'recovered') {
      updates.repsCount = current.repsCount + 1;
      updates.lastDoneDate = today;
      updates.state = 'active';
      updates.missedDate = null;
    } else if (state === 'missed') {
      updates.state = 'missed';
      updates.missedDate = today;
    }
    return updateHabitData(updates);
  }

  const checkIn: CheckIn = {
    ...checkInData,
    id: generateCheckInId(),
    checkedInAt: new Date().toISOString(),
    date: today,
  };

  // Add to check-ins array
  const checkIns = [...(current.checkIns || []), checkIn];

  const updates: Partial<HabitData> = {
    checkIns,
    lastActiveDate: new Date().toISOString(),
  };

  // Update state/counts based on check-in state
  const state = getCheckInState(checkIn);

  if (state === 'completed' || state === 'recovered') {
    updates.repsCount = current.repsCount + 1;
    updates.lastDoneDate = today;
    updates.state = 'active';
    updates.missedDate = null;
  } else if (state === 'missed') {
    updates.state = 'missed';
    updates.missedDate = today;
  }
  // 'no_trigger' doesn't change state/counts but is still valuable data

  return updateHabitData(updates);
}

/**
 * Get today's check-in if it exists
 */
export function getTodayCheckIn(): CheckIn | null {
  const current = loadHabitData();
  const today = new Date().toISOString().split('T')[0];
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
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

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
  const today = new Date().toISOString().split('T')[0];

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
  const today = new Date().toISOString().split('T')[0];

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
  const today = new Date().toISOString().split('T')[0];

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
// REFLECTION SYSTEM FUNCTIONS (R18)
// ============================================

/**
 * Save a weekly/recovery reflection
 */
export function saveReflection(reflection: WeeklyReflection): HabitData {
  const current = loadHabitData();
  const reflections = [...(current.reflections || []), reflection];

  // Compute next reflection due (7 days from now)
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + 7);

  return updateHabitData({
    reflections,
    lastReflectionDate: new Date().toISOString(),
    nextReflectionDue: nextDue.toISOString(),
  });
}

// ============================================
// PATTERN CACHING FUNCTIONS (R18)
// ============================================

/**
 * Save a pattern snapshot to cache
 */
export function savePatternSnapshot(snapshot: PatternSnapshot): HabitData {
  const current = loadHabitData();
  const history = [...(current.patternHistory || []), snapshot];

  return updateHabitData({
    patternHistory: history,
    latestPatternGeneratedAt: snapshot.generatedAt,
  });
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
  const today = new Date().toISOString().split('T')[0];

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
