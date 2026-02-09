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
