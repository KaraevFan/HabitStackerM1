import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadHabitData,
  saveHabitData,
  logRepEvent,
  isRecoveryRequired,
  resetHabitData,
} from "./habit-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

describe("habit-store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-14T10:00:00Z"));
  });

  it("loads initial state when no data exists", () => {
    const data = loadHabitData();
    expect(data.state).toBe("install");
    expect(data.repsCount).toBe(0);
    expect(data.events).toEqual([]);
  });

  it("persists and loads data", () => {
    const data = loadHabitData();
    data.repsCount = 5;
    saveHabitData(data);

    const loaded = loadHabitData();
    expect(loaded.repsCount).toBe(5);
  });

  it("logs rep_done and updates state to active", () => {
    logRepEvent({ type: "rep_done" });

    const data = loadHabitData();
    expect(data.state).toBe("active");
    expect(data.repsCount).toBe(1);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].type).toBe("rep_done");
  });

  it("logs miss and sets state to missed", () => {
    logRepEvent({ type: "rep_done" });
    logRepEvent({ type: "miss" });

    const data = loadHabitData();
    expect(data.state).toBe("missed");
    expect(isRecoveryRequired()).toBe(true);
  });

  it("recovery_done restores active state", () => {
    logRepEvent({ type: "rep_done" });
    logRepEvent({ type: "miss" });
    logRepEvent({ type: "recovery_done" });

    const data = loadHabitData();
    expect(data.state).toBe("active");
    expect(data.repsCount).toBe(2); // First rep + recovery
    expect(isRecoveryRequired()).toBe(false);
  });

  it("resets all data", () => {
    logRepEvent({ type: "rep_done" });
    resetHabitData();

    const data = loadHabitData();
    expect(data.state).toBe("install");
    expect(data.repsCount).toBe(0);
  });
});
