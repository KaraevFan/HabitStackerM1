import type {
  HabitData,
  CheckIn,
  CheckInState,
  DayMemory,
  WeeklyReflection,
  PatternSnapshot,
  HabitSystem,
} from "@/types/habit";

/**
 * HabitRepository — the seam between components and storage.
 *
 * Current implementation: localStorage (habitStore.ts)
 * Future implementation: Supabase
 *
 * All methods are async to support both sync localStorage
 * and async Supabase without interface changes.
 */
export interface HabitRepository {
  // ── Habit lifecycle ──────────────────────────────────
  getHabit(): Promise<HabitData | null>;
  saveHabit(updates: Partial<HabitData>): Promise<HabitData>;
  resetHabit(): Promise<HabitData>;

  // ── Check-ins ────────────────────────────────────────
  getTodayCheckIn(): Promise<CheckIn | null>;
  getTodayCheckInState(): Promise<CheckInState>;
  getCheckIns(days: number): Promise<CheckIn[]>;
  getCheckInStats(days: number): Promise<{
    completed: number;
    missed: number;
    noTrigger: number;
    recovered: number;
    total: number;
  }>;
  logCheckIn(
    data: Omit<CheckIn, "id" | "checkedInAt">,
    dateOverride?: string
  ): Promise<HabitData>;
  updateTodayCheckIn(
    updates: Partial<
      Pick<CheckIn, "difficultyRating" | "note" | "outcomeSuccess" | "missReason" | "systemChangeProposed">
    >
  ): Promise<HabitData>;
  updateCheckInConversation(
    checkInId: string,
    conversation: {
      messages?: Array<{ role: "ai" | "user"; content: string }>;
      skipped?: boolean;
      duration?: number;
    }
  ): Promise<HabitData>;
  updateTodayConversation(conversation: {
    messages?: Array<{ role: "ai" | "user"; content: string }>;
    skipped?: boolean;
    duration?: number;
    reflection?: {
      summary: string;
      quantitative?: string;
      sentiment?: "positive" | "neutral" | "challenging";
      frictionNote?: string;
    };
  }): Promise<HabitData>;
  logBackfillCheckIn(
    date: string,
    data: Partial<
      Pick<CheckIn, "triggerOccurred" | "actionTaken" | "note" | "difficulty" | "difficultyRating" | "missReason">
    >
  ): Promise<HabitData>;

  // ── Recovery ─────────────────────────────────────────
  acceptRecovery(): Promise<HabitData>;
  completeRecovery(): Promise<HabitData>;
  skipRecovery(): Promise<HabitData>;
  needsRecovery(): Promise<boolean>;
  needsReentry(): Promise<boolean>;

  // ── Day memories ─────────────────────────────────────
  getDayMemories(limit?: number): Promise<DayMemory[]>;
  saveDayMemory(memory: DayMemory): Promise<HabitData>;

  // ── Reflections ──────────────────────────────────────
  getReflections(): Promise<WeeklyReflection[]>;
  saveReflection(reflection: WeeklyReflection): Promise<HabitData>;

  // ── Patterns ─────────────────────────────────────────
  getLatestPatternSnapshot(): Promise<PatternSnapshot | null>;
  savePatternSnapshot(snapshot: PatternSnapshot): Promise<HabitData>;
  shouldRegeneratePatterns(): Promise<boolean>;

  // ── System mutations ─────────────────────────────────
  saveHabitSystem(system: HabitSystem): Promise<HabitData>;
  updateSystemToolkit(toolkit: {
    tinyVersion?: string;
    environmentPrime?: string;
    frictionReduced?: string;
  }): Promise<HabitData>;

  // ── Graduation / pause ───────────────────────────────
  graduateHabit(): Promise<HabitData>;
  pauseHabit(reason: string, reentryPlan?: string): Promise<HabitData>;
}
