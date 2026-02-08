/**
 * Local date utilities for Habit Stacker
 *
 * All date logic in the app MUST use these functions.
 * Never use new Date().toISOString().split('T')[0] — that's UTC.
 */

/**
 * Returns the local calendar date as YYYY-MM-DD.
 * This is THE date function used everywhere in the app.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's local calendar date as YYYY-MM-DD.
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Determines if a given date string is "today" in local time.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

/**
 * Determines if a given date string is "yesterday" in local time.
 */
export function isYesterday(dateStr: string): boolean {
  return dateStr === getYesterdayDateString();
}

/**
 * Returns the number of days between a date string and today (local time).
 * Positive = date is in the past. Negative = date is in the future.
 */
export function daysSince(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}
