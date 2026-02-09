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

  describe("isYesterday", () => {
    it("returns true for yesterday's date string", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(isYesterday("2026-02-08")).toBe(true);
    });

    it("returns false for today", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 10, 0, 0));
      expect(isYesterday("2026-02-09")).toBe(false);
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

    it("handles date string without timezone info correctly", () => {
      vi.setSystemTime(new Date(2026, 1, 9, 23, 59, 0)); // late night
      // Should still be 1 day since yesterday, not 0 or 2
      expect(daysSince("2026-02-08")).toBe(1);
    });
  });
});
