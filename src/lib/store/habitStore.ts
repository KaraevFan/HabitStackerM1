import { HabitData, RepEvent, RepLog, HabitSystem, createInitialHabitData, ConsultStep, PlanDetails, HabitSnapshot, generateRepLogId } from "@/types/habit";

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
 * Log a rep with optional photo (R8)
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
