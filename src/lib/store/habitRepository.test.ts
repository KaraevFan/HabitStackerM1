import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRepository, resetRepository } from "./repositoryProvider";
import type { HabitRepository } from "./habitRepository";

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
      coachObservation: "Building momentum",
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
      completedAt: "2026-02-09T10:00:00Z",
      sustainability: "yes",
      friction: "Morning timing is hard",
      recommendation: null,
      checkInsSummary: { completed: 5, total: 7, avgDifficulty: 2.5, difficultyTrend: "stable" },
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
