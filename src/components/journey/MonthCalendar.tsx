'use client';

import { useState, useMemo } from 'react';
import { CheckIn, getCheckInState } from '@/types/habit';

interface MonthCalendarProps {
  checkIns: CheckIn[];
  startDate: string; // ISO date when habit was created
  onDaySelect?: (date: string) => void;
}

type DayStatus = 'completed' | 'recovered' | 'missed' | 'no_trigger' | 'empty' | 'future' | 'before_start';

/**
 * Get status for a day based on check-in data
 */
function getDayStatus(
  dateStr: string,
  today: string,
  startDate: string,
  checkInsByDate: Map<string, CheckIn>
): DayStatus {
  // Before habit started
  if (dateStr < startDate) {
    return 'before_start';
  }

  // Future dates
  if (dateStr > today) {
    return 'future';
  }

  const checkIn = checkInsByDate.get(dateStr);
  if (!checkIn) {
    return 'empty';
  }

  const state = getCheckInState(checkIn);
  switch (state) {
    case 'completed':
      return 'completed';
    case 'recovered':
      return 'recovered';
    case 'missed':
      return 'missed';
    case 'no_trigger':
      return 'no_trigger';
    default:
      return 'empty';
  }
}

/**
 * Format date for display
 */
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get all days in a month as a grid (with padding for alignment)
 */
function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: (Date | null)[] = [];

  // Add padding for days before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

/**
 * Format date as YYYY-MM-DD
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * MonthCalendar - Calendar grid showing habit completion history
 */
export default function MonthCalendar({
  checkIns,
  startDate,
  onDaySelect,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = useMemo(() => toDateString(new Date()), []);

  // Build check-in lookup map
  const checkInsByDate = useMemo(() => {
    const map = new Map<string, CheckIn>();
    for (const checkIn of checkIns) {
      const existing = map.get(checkIn.date);
      if (!existing || checkIn.checkedInAt > existing.checkedInAt) {
        map.set(checkIn.date, checkIn);
      }
    }
    return map;
  }, [checkIns]);

  // Get days for current month
  const monthDays = useMemo(
    () => getMonthDays(currentMonth.year, currentMonth.month),
    [currentMonth]
  );

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Check if we can navigate forward (don't go past current month)
  const now = new Date();
  const canGoNext =
    currentMonth.year < now.getFullYear() ||
    (currentMonth.year === now.getFullYear() && currentMonth.month < now.getMonth());

  // Format start date for display
  const startDateFormatted = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={goToPreviousMonth}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Previous month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h3 className="text-lg font-medium text-[var(--text-primary)]">
          {formatMonthYear(new Date(currentMonth.year, currentMonth.month))}
        </h3>

        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={`p-2 transition-colors ${
            canGoNext
              ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] opacity-30 cursor-not-allowed'
          }`}
          aria-label="Next month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-[var(--text-tertiary)] py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((date, index) => {
          if (!date) {
            // Empty padding cell
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = toDateString(date);
          const status = getDayStatus(dateStr, today, startDate, checkInsByDate);
          const isToday = dateStr === today;
          const isSelectable = status !== 'future' && status !== 'before_start';

          return (
            <button
              key={dateStr}
              onClick={() => isSelectable && onDaySelect?.(dateStr)}
              disabled={!isSelectable}
              className={`
                aspect-square rounded-lg flex items-center justify-center relative
                transition-all text-sm
                ${isSelectable ? 'hover:bg-[var(--bg-secondary)]' : ''}
                ${isToday ? 'ring-2 ring-[var(--accent-primary)] ring-inset' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`
                  ${status === 'future' || status === 'before_start' ? 'text-[var(--text-tertiary)] opacity-40' : ''}
                  ${status === 'empty' ? 'text-[var(--text-secondary)]' : ''}
                  ${isToday ? 'font-semibold text-[var(--accent-primary)]' : ''}
                `}
              >
                {date.getDate()}
              </span>

              {/* Status indicator dot */}
              {status !== 'future' && status !== 'before_start' && status !== 'empty' && (
                <div
                  className={`
                    absolute bottom-1 left-1/2 -translate-x-1/2
                    w-1.5 h-1.5 rounded-full
                    ${status === 'completed' ? 'bg-[var(--accent-primary)]' : ''}
                    ${status === 'recovered' ? 'bg-[var(--accent-secondary)]' : ''}
                    ${status === 'missed' ? 'bg-red-400' : ''}
                    ${status === 'no_trigger' ? 'bg-blue-300' : ''}
                  `}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend and start date */}
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] px-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span>Missed</span>
          </div>
        </div>
        <div>Started: {startDateFormatted}</div>
      </div>
    </div>
  );
}
