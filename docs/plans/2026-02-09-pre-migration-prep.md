# Pre-Migration Prep (Phase 1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare the Habit Stacker codebase for Supabase migration by standardizing dates, extracting a data access layer, adding critical path tests, and converting endpoints to streaming.

**Architecture:** Extract a `HabitRepository` interface from the current monolithic `habitStore.ts`. All components and hooks switch to calling the repository. First implementation wraps localStorage (no behavior change). Supabase implementation swaps in later behind the same interface.

**Tech Stack:** TypeScript, Vitest, React error boundaries, Server-Sent Events (Anthropic streaming API)

**Parent doc:** `docs/plans/2025-02-09-supabase-migration-risk-plan.md`

---

## Task 1: Audit and Fix Date/Time Handling

**Files:**
- Modify: `src/lib/dateUtils.ts` (lines 1-51)
- Modify: `src/lib/store/habitStore.ts` (lines 19, 239-250, 787-805)
- Modify: `src/hooks/useUserState.ts` (lines 24-43)
- Modify: `src/components/runtime/PlanScreen.tsx` (lines 34-70)
- Test: `src/lib/dateUtils.test.ts` (create)

This task ensures all date logic is correct and tested before the schema depends on it.

**Step 1: Write failing tests for dateUtils**

```typescript
// src/lib/dateUtils.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getLocalDateString, getYesterdayDateString, isToday, isYesterday, daysSince } from "./dateUtils";

describe("dateUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLocalDateString", () => {
    it("returns YYYY-MM-DD in local time", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 15, 30, 0)); // Feb 9 2026 3:30pm local
      expect(getLocalDateString()).toBe("2026-02-09");
    });

    it("handles midnight correctly", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 0, 0, 0)); // midnight local
      expect(getLocalDateString()).toBe("2026-02-09");
    });

    it("handles 11:59pm correctly (no date drift)", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 23, 59, 59)); // 11:59pm local
      expect(getLocalDateString()).toBe("2026-02-09");
    });

    it("accepts a Date argument", () => {
      const date = new Date(2026, 0, 1, 10, 0, 0); // Jan 1
      expect(getLocalDateString(date)).toBe("2026-01-01");
    });
  });

  describe("getYesterdayDateString", () => {
    it("returns yesterday in local time", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(getYesterdayDateString()).toBe("2026-02-08");
    });

    it("handles month boundary", () => {
      vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0)); // Mar 1
      expect(getYesterdayDateString()).toBe("2026-02-28");
    });
  });

  describe("isToday", () => {
    it("returns true for today's date string", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(isToday("2026-02-09")).toBe(true);
    });

    it("returns false for yesterday", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(isToday("2026-02-08")).toBe(false);
    });
  });

  describe("daysSince", () => {
    it("returns 0 for today", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(daysSince("2026-02-09")).toBe(0);
    });

    it("returns 1 for yesterday", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(daysSince("2026-02-08")).toBe(1);
    });

    it("returns 7 for a week ago", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(daysSince("2026-02-02")).toBe(7);
    });
  });
});
```

**Step 2: Run tests to verify they pass**

```bash
npx vitest run src/lib/dateUtils.test.ts
```

Expected: All tests PASS (these test the existing implementation, not new code).

**Step 3: Audit date usage across the codebase**

Search for all date-related calls and verify each uses `getLocalDateString()` consistently:

```bash
# Find any raw Date-to-string conversions that bypass dateUtils
grep -rn "toISOString().split" src/ --include="*.ts" --include="*.tsx"
grep -rn "toLocaleDateString" src/ --include="*.ts" --include="*.tsx"
grep -rn "new Date()\.toISOString()" src/lib/store/ --include="*.ts"
```

Any hits outside of `checkedInAt`, `updatedAt`, `createdAt`, or `lastActiveDate` (which are intentionally ISO timestamps, not calendar dates) are bugs. Fix by replacing with `getLocalDateString()`.

**Step 4: Verify `daysSince` handles timezone edge case**

The current `daysSince` implementation at `dateUtils.ts:49` uses `new Date(dateStr + 'T00:00:00')` which creates a local-time Date. This is correct for our use case. Verify:

```typescript
// Add to dateUtils.test.ts
it("handles date string without timezone info correctly", () => {
  vi.setSystemTime(new Date(2026, 1, 9, 23, 59, 0)); // late night
  // Should still be 1 day since yesterday, not 0 or 2
  expect(daysSince("2026-02-08")).toBe(1);
});
```

**Step 5: Commit**

```bash
git add src/lib/dateUtils.test.ts
git commit -m "test: add date utility tests covering timezone edge cases"
```

---

## Task 2: Define the HabitRepository Interface

**Files:**
- Create: `src/lib/store/habitRepository.ts`
- Reference: `src/lib/store/habitStore.ts` (all exported functions)
- Reference: `src/types/habit.ts` (CheckIn, DayMemory, WeeklyReflection, PatternSnapshot, HabitData, HabitSystem)

**Step 1: Create the repository interface**

```typescript
// src/lib/store/habitRepository.ts
import type {
  HabitData,
  CheckIn,
  CheckInState,
  DayMemory,
  WeeklyReflection,
  PatternSnapshot,
  HabitSystem,
  HabitSnapshot,
  ConsultStep,
  PlanDetails,
  CoachNotes,
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
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/lib/store/habitRepository.ts
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/store/habitRepository.ts
git commit -m "feat: define HabitRepository interface for storage abstraction"
```

---

## Task 3: Implement LocalStorageHabitRepository

**Files:**
- Create: `src/lib/store/localStorageHabitRepository.ts`
- Reference: `src/lib/store/habitStore.ts` (wrap existing functions)
- Reference: `src/lib/store/habitRepository.ts` (implement interface)

This is a thin adapter — every method delegates to the existing `habitStore.ts` function. No logic changes.

**Step 1: Write the adapter**

```typescript
// src/lib/store/localStorageHabitRepository.ts
import type { HabitRepository } from "./habitRepository";
import * as store from "./habitStore";

/**
 * localStorage-backed implementation of HabitRepository.
 * Every method wraps an existing habitStore function as async.
 */
export function createLocalStorageRepository(): HabitRepository {
  return {
    // ── Habit lifecycle ──
    async getHabit() {
      const data = store.loadHabitData();
      return data.state === "install" ? null : data;
    },
    async saveHabit(updates) {
      return store.updateHabitData(updates);
    },
    async resetHabit() {
      return store.resetHabitData();
    },

    // ── Check-ins ──
    async getTodayCheckIn() {
      return store.getTodayCheckIn();
    },
    async getTodayCheckInState() {
      return store.getTodayCheckInState();
    },
    async getCheckIns(days) {
      return store.getRecentCheckIns(days);
    },
    async getCheckInStats(days) {
      return store.getCheckInStats(days);
    },
    async logCheckIn(data, dateOverride) {
      return store.logCheckIn(data, dateOverride);
    },
    async updateTodayCheckIn(updates) {
      return store.updateTodayCheckIn(updates);
    },
    async updateCheckInConversation(checkInId, conversation) {
      return store.updateCheckInConversation(checkInId, conversation);
    },
    async updateTodayConversation(conversation) {
      return store.updateTodayConversation(conversation);
    },
    async logBackfillCheckIn(date, data) {
      return store.logBackfillCheckIn(date, data);
    },

    // ── Recovery ──
    async acceptRecovery() {
      return store.acceptRecovery();
    },
    async completeRecovery() {
      return store.completeRecovery();
    },
    async skipRecovery() {
      return store.skipRecovery();
    },
    async needsRecovery() {
      return store.needsRecovery();
    },
    async needsReentry() {
      return store.needsReentry();
    },

    // ── Day memories ──
    async getDayMemories(limit) {
      const data = store.loadHabitData();
      const memories = data.dayMemories || [];
      return limit ? memories.slice(-limit) : memories;
    },
    async saveDayMemory(memory) {
      return store.saveDayMemory(memory);
    },

    // ── Reflections ──
    async getReflections() {
      const data = store.loadHabitData();
      return data.reflections || [];
    },
    async saveReflection(reflection) {
      return store.saveReflection(reflection);
    },

    // ── Patterns ──
    async getLatestPatternSnapshot() {
      return store.getLatestPatternSnapshot();
    },
    async savePatternSnapshot(snapshot) {
      return store.savePatternSnapshot(snapshot);
    },
    async shouldRegeneratePatterns() {
      return store.shouldRegeneratePatterns();
    },

    // ── System mutations ──
    async saveHabitSystem(system) {
      return store.saveHabitSystem(system);
    },
    async updateSystemToolkit(toolkit) {
      return store.updateSystemToolkit(toolkit);
    },

    // ── Graduation / pause ──
    async graduateHabit() {
      return store.graduateHabit();
    },
    async pauseHabit(reason, reentryPlan) {
      return store.pauseHabit(reason, reentryPlan);
    },
  };
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/lib/store/localStorageHabitRepository.ts
```

Expected: No errors. Every method signature matches `HabitRepository`.

**Step 3: Commit**

```bash
git add src/lib/store/localStorageHabitRepository.ts
git commit -m "feat: add localStorage adapter implementing HabitRepository"
```

---

## Task 4: Create Repository Provider and Hook

**Files:**
- Create: `src/lib/store/repositoryProvider.ts`
- Reference: `src/lib/store/habitRepository.ts`
- Reference: `src/lib/store/localStorageHabitRepository.ts`

This provides a singleton repository instance. Later, swapping to Supabase means changing one line here.

**Step 1: Create the provider**

```typescript
// src/lib/store/repositoryProvider.ts
import type { HabitRepository } from "./habitRepository";
import { createLocalStorageRepository } from "./localStorageHabitRepository";

let _repository: HabitRepository | null = null;

/**
 * Get the active HabitRepository instance.
 * Currently returns localStorage-backed implementation.
 * To migrate to Supabase, swap the factory function here.
 */
export function getRepository(): HabitRepository {
  if (!_repository) {
    _repository = createLocalStorageRepository();
  }
  return _repository;
}

/**
 * Override the repository (useful for testing).
 */
export function setRepository(repo: HabitRepository): void {
  _repository = repo;
}

/**
 * Reset to default (useful for testing teardown).
 */
export function resetRepository(): void {
  _repository = null;
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/lib/store/repositoryProvider.ts
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/store/repositoryProvider.ts
git commit -m "feat: add repository provider with test override support"
```

---

## Task 5: Write Critical Path Tests Against the Repository

**Files:**
- Create: `src/lib/store/habitRepository.test.ts`
- Reference: `src/lib/store/habitRepository.ts`
- Reference: `src/lib/store/repositoryProvider.ts`
- Reference: `src/types/habit.ts` (createInitialHabitData, CheckIn)

These tests cover the core daily loop. They test the repository interface — when the implementation swaps to Supabase, these same tests must still pass.

**Step 1: Write the tests**

```typescript
// src/lib/store/habitRepository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRepository, resetRepository } from "./repositoryProvider";
import type { HabitRepository } from "./habitRepository";
import type { CheckIn, HabitSystem } from "@/types/habit";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("HabitRepository (localStorage)", () => {
  let repo: HabitRepository;

  beforeEach(() => {
    localStorageMock.clear();
    resetRepository();
    repo = getRepository();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0)); // Feb 9 2026 10am
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Habit lifecycle ──

  it("returns null when no habit exists", async () => {
    const habit = await repo.getHabit();
    expect(habit).toBeNull();
  });

  it("persists and retrieves a habit", async () => {
    await repo.saveHabit({ state: "active", repsCount: 3 });
    const habit = await repo.getHabit();
    expect(habit).not.toBeNull();
    expect(habit!.state).toBe("active");
    expect(habit!.repsCount).toBe(3);
  });

  it("resets habit to initial state", async () => {
    await repo.saveHabit({ state: "active", repsCount: 5 });
    await repo.resetHabit();
    const habit = await repo.getHabit();
    expect(habit).toBeNull(); // install state = null from getHabit
  });

  // ── Check-in: done ──

  it("logs a completed check-in for today", async () => {
    await repo.saveHabit({ state: "active" });

    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: true,
      recoveryOffered: false,
    });

    const checkIn = await repo.getTodayCheckIn();
    expect(checkIn).not.toBeNull();
    expect(checkIn!.date).toBe("2026-02-09");
    expect(checkIn!.actionTaken).toBe(true);

    const habit = await repo.getHabit();
    expect(habit!.state).toBe("active");
    expect(habit!.repsCount).toBe(1);
    expect(habit!.lastDoneDate).toBe("2026-02-09");
  });

  it("returns correct check-in state after completion", async () => {
    await repo.saveHabit({ state: "active" });
    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: true,
      recoveryOffered: false,
    });

    const state = await repo.getTodayCheckInState();
    expect(state).toBe("completed");
  });

  // ── Check-in: miss ──

  it("logs a miss and transitions state", async () => {
    await repo.saveHabit({ state: "active" });

    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: false,
      recoveryOffered: true,
      missReason: "Was too tired",
    });

    const habit = await repo.getHabit();
    expect(habit!.state).toBe("missed");
    expect(habit!.missedDate).toBe("2026-02-09");

    const state = await repo.getTodayCheckInState();
    expect(state).toBe("missed");
  });

  // ── Recovery flow ──

  it("accepts and completes recovery, restoring active state", async () => {
    await repo.saveHabit({ state: "active", repsCount: 1 });

    // Log a miss
    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: false,
      recoveryOffered: true,
    });

    // Accept recovery
    await repo.acceptRecovery();
    const afterAccept = await repo.getTodayCheckIn();
    expect(afterAccept!.recoveryAccepted).toBe(true);

    // Complete recovery
    await repo.completeRecovery();
    const habit = await repo.getHabit();
    expect(habit!.state).toBe("active");
    expect(habit!.missedDate).toBeNull();
    expect(habit!.repsCount).toBe(2); // 1 original + 1 recovery
  });

  it("skip recovery restores active without incrementing reps", async () => {
    await repo.saveHabit({ state: "missed", repsCount: 1 });

    await repo.skipRecovery();
    const habit = await repo.getHabit();
    expect(habit!.state).toBe("active");
    expect(habit!.repsCount).toBe(1); // unchanged
  });

  // ── Data survives reload ──

  it("persists data across repository resets (simulated reload)", async () => {
    await repo.saveHabit({ state: "active" });
    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: true,
      recoveryOffered: false,
    });

    // Simulate page reload
    resetRepository();
    const freshRepo = getRepository();

    const habit = await freshRepo.getHabit();
    expect(habit!.state).toBe("active");
    expect(habit!.repsCount).toBe(1);

    const checkIn = await freshRepo.getTodayCheckIn();
    expect(checkIn).not.toBeNull();
    expect(checkIn!.actionTaken).toBe(true);
  });

  // ── Check-in range queries ──

  it("returns check-ins for last N days", async () => {
    await repo.saveHabit({ state: "active" });

    // Log check-ins for 3 different days
    for (let i = 0; i < 3; i++) {
      const date = `2026-02-0${9 - i}`;
      await repo.logCheckIn({
        date,
        triggerOccurred: true,
        actionTaken: true,
        recoveryOffered: false,
      }, date);
    }

    const recent = await repo.getCheckIns(7);
    expect(recent.length).toBe(3);
    // Should be sorted by date ascending
    expect(recent[0].date).toBe("2026-02-07");
    expect(recent[2].date).toBe("2026-02-09");
  });

  // ── Stats ──

  it("calculates check-in stats correctly", async () => {
    await repo.saveHabit({ state: "active" });

    // 2 completions
    await repo.logCheckIn({
      date: "2026-02-09",
      triggerOccurred: true,
      actionTaken: true,
      recoveryOffered: false,
    }, "2026-02-09");

    await repo.logCheckIn({
      date: "2026-02-08",
      triggerOccurred: true,
      actionTaken: true,
      recoveryOffered: false,
    }, "2026-02-08");

    // 1 miss
    await repo.logCheckIn({
      date: "2026-02-07",
      triggerOccurred: true,
      actionTaken: false,
      recoveryOffered: true,
    }, "2026-02-07");

    const stats = await repo.getCheckInStats(7);
    expect(stats.completed).toBe(2);
    expect(stats.missed).toBe(1);
    expect(stats.total).toBe(3);
  });

  // ── Day memories ──

  it("saves and retrieves day memories", async () => {
    await repo.saveHabit({ state: "active" });

    await repo.saveDayMemory({
      date: "2026-02-09",
      outcome: "completed",
      userShared: "Felt good about it",
      winNote: "Did it without thinking",
      emotionalTone: "positive",
    });

    const memories = await repo.getDayMemories(7);
    expect(memories.length).toBe(1);
    expect(memories[0].outcome).toBe("completed");
  });

  // ── Reflections ──

  it("saves and retrieves reflections", async () => {
    await repo.saveHabit({ state: "active" });

    await repo.saveReflection({
      id: "ref-1",
      weekNumber: 1,
      type: "weekly",
      sustainabilityRating: 4,
      friction: "Morning timing is hard",
      createdAt: "2026-02-09T10:00:00Z",
      checkInsSummary: { completed: 5, missed: 2, total: 7 },
    });

    const reflections = await repo.getReflections();
    expect(reflections.length).toBe(1);
    expect(reflections[0].weekNumber).toBe(1);
  });

  // ── Graduation ──

  it("graduates habit to maintained state", async () => {
    await repo.saveHabit({ state: "active", repsCount: 28 });
    await repo.graduateHabit();

    const habit = await repo.getHabit();
    expect(habit!.state).toBe("maintained");
    expect(habit!.graduatedAt).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify**

```bash
npx vitest run src/lib/store/habitRepository.test.ts
```

Expected: All tests PASS. These test the localStorage adapter against the repository interface.

**Step 3: Commit**

```bash
git add src/lib/store/habitRepository.test.ts
git commit -m "test: add critical path tests for HabitRepository interface"
```

---

## Task 6: Delete Legacy Test File

**Files:**
- Delete: `src/lib/store/habit-store.test.ts`

The existing test file imports from `./habit-store` which doesn't exist (the module is `./habitStore`). It tests legacy functions (`logRepEvent`, `isRecoveryRequired`) that are no longer the primary API. The new repository tests (Task 5) replace this.

**Step 1: Delete the file**

```bash
rm src/lib/store/habit-store.test.ts
```

**Step 2: Verify all tests still pass**

```bash
npx vitest run
```

Expected: All remaining tests PASS.

**Step 3: Commit**

```bash
git add -u src/lib/store/habit-store.test.ts
git commit -m "chore: remove legacy test file importing nonexistent module"
```

---

## Task 7: Add React Error Boundaries

**Files:**
- Create: `src/components/common/ErrorBoundary.tsx`
- Modify: `src/components/runtime/PlanScreen.tsx` (wrap in boundary)
- Modify: `src/components/checkin/CheckInFlow.tsx` (wrap in boundary)

**Step 1: Create the ErrorBoundary component**

```tsx
// src/components/common/ErrorBoundary.tsx
"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  screenName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.screenName}] Error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          padding: "2rem",
          textAlign: "center",
          color: "#1A1816",
          fontFamily: "Outfit, sans-serif",
        }}>
          <h2 style={{ fontFamily: "Fraunces, serif", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B6560", marginBottom: "1rem" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "0.5rem 1rem",
              background: "#2D6A5D",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/common/ErrorBoundary.tsx
```

Expected: No errors.

**Step 3: Wrap PlanScreen**

Find the PlanScreen export in `src/components/runtime/PlanScreen.tsx`. Wrap the component's return JSX in an ErrorBoundary. Add the import at the top of the file:

```typescript
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
```

Then wrap the outermost JSX in the return statement:

```tsx
return (
  <ErrorBoundary screenName="PlanScreen">
    {/* existing JSX */}
  </ErrorBoundary>
);
```

**Step 4: Wrap CheckInFlow**

Same pattern in `src/components/checkin/CheckInFlow.tsx`:

```typescript
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
```

```tsx
return (
  <ErrorBoundary screenName="CheckInFlow">
    {/* existing JSX */}
  </ErrorBoundary>
);
```

**Step 5: Verify the app builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add src/components/common/ErrorBoundary.tsx src/components/runtime/PlanScreen.tsx src/components/checkin/CheckInFlow.tsx
git commit -m "feat: add error boundaries around PlanScreen and CheckInFlow"
```

---

## Task 8: Convert Reflection Endpoint to Streaming

**Files:**
- Modify: `src/app/api/reflection/stream/route.ts`
- Reference: `src/app/api/intake/stream/route.ts` (streaming pattern to follow)

The current reflection endpoint returns a full JSON response. Convert to SSE to match the intake streaming pattern.

**Step 1: Read the current implementation**

Read `src/app/api/reflection/stream/route.ts` fully. Note the `callAnthropic()` function (non-streaming) and the POST handler that returns `NextResponse.json()`.

**Step 2: Replace `callAnthropic` with `streamAnthropic`**

Follow the pattern from `src/app/api/intake/stream/route.ts:73-146`. Replace the non-streaming `callAnthropic()` with a streaming version that:
1. Calls Anthropic with `stream: true`
2. Reads chunks from the response body reader
3. Yields text deltas via SSE format (`data: {"type":"text_delta","text":"..."}\n\n`)
4. Sends a final `data: {"type":"final","response":{...}}\n\n` event with the parsed JSON

The POST handler should return a `Response` with a `ReadableStream` and `Content-Type: text/event-stream` headers instead of `NextResponse.json()`.

**Step 3: Update the client-side hook**

Find the component that calls this endpoint (likely in `src/components/checkin/CheckInConversation.tsx` or similar). Update it to read SSE chunks instead of awaiting a JSON response. Follow the pattern used by the intake chat component.

**Step 4: Verify streaming works**

```bash
npm run dev
# Navigate to the app, complete a check-in, verify the reflection response streams in character-by-character
```

**Step 5: Commit**

```bash
git add src/app/api/reflection/stream/route.ts src/components/checkin/CheckInConversation.tsx
git commit -m "feat: convert reflection endpoint to true SSE streaming"
```

---

## Task 9: Convert Recovery Endpoint to Streaming

**Files:**
- Modify: `src/app/api/recovery/stream/route.ts`
- Reference: `src/app/api/intake/stream/route.ts` (streaming pattern)

Same transformation as Task 8 but for the recovery coach endpoint.

**Step 1: Replace `callAnthropic` with `streamAnthropic`**

Follow the exact same pattern as Task 8. The recovery endpoint at `src/app/api/recovery/stream/route.ts` has the same structure: `callAnthropic()` (non-streaming) → `NextResponse.json()`.

Convert to: `streamAnthropic()` (streaming) → `ReadableStream` with SSE events.

**Step 2: Update the client-side component**

Find the recovery conversation component. Update it to consume SSE events instead of awaiting JSON.

**Step 3: Verify streaming works**

```bash
npm run dev
# Navigate to the app, trigger a miss, enter recovery conversation, verify streaming
```

**Step 4: Commit**

```bash
git add src/app/api/recovery/stream/route.ts
git commit -m "feat: convert recovery coach endpoint to true SSE streaming"
```

---

## Task 10: Convert Weekly Reflection Endpoint to Streaming

**Files:**
- Modify: `src/app/api/weekly-reflection/route.ts`
- Reference: `src/app/api/intake/stream/route.ts` (streaming pattern)

Same transformation as Tasks 8-9 for the weekly reflection endpoint.

**Step 1: Replace `callAnthropic` with `streamAnthropic`**

Same pattern. This endpoint is at `src/app/api/weekly-reflection/route.ts` (not under `/stream/`).

**Step 2: Update the client-side component**

Update `src/components/reflection/WeeklyReflectionConversation.tsx` to consume SSE events.

**Step 3: Verify streaming works**

```bash
npm run dev
# Trigger a weekly reflection, verify the response streams in
```

**Step 4: Commit**

```bash
git add src/app/api/weekly-reflection/route.ts src/components/reflection/WeeklyReflectionConversation.tsx
git commit -m "feat: convert weekly reflection endpoint to true SSE streaming"
```

---

## Task 11: Final Verification

**Files:** None (verification only)

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

**Step 2: Run type checker**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No lint errors.

**Step 4: Run production build**

```bash
npm run build
```

Expected: Build succeeds.

**Step 5: Manual smoke test**

Walk through the core loop:
1. Open app → see welcome screen (or existing habit if data exists)
2. If existing habit: log today's rep → verify reflection conversation streams (not spinner)
3. Log a miss → verify recovery conversation streams
4. Check PlanScreen → verify all tabs render without error boundary triggering
5. Verify data persists after page reload

**Step 6: Commit any final fixes, then tag the milestone**

```bash
git tag pre-migration-prep-complete
```
