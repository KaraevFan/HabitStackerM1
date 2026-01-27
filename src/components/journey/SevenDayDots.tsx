'use client';

import { RepLog } from '@/types/habit';

interface SevenDayDotsProps {
  repLogs: RepLog[];
}

/**
 * Get day label (M, T, W, T, F, S, S)
 */
function getDayLabel(date: Date): string {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[date.getDay()];
}

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Determine dot status for a given date
 */
function getDotStatus(
  dateStr: string,
  today: string,
  repLogsByDate: Map<string, RepLog>
): 'completed' | 'missed' | 'empty' | 'future' {
  // Future dates (after today)
  if (dateStr > today) {
    return 'future';
  }

  const log = repLogsByDate.get(dateStr);
  if (!log) {
    // No data for this date
    // If it's today and no log yet, show as empty (anticipation)
    return 'empty';
  }

  // Has log - check type
  if (log.type === 'done' || log.type === 'recovery') {
    return 'completed';
  }
  if (log.type === 'missed') {
    return 'missed';
  }

  return 'empty';
}

/**
 * SevenDayDots - Visual 7-day rolling history
 * Shows rep completion status without streak framing
 */
export default function SevenDayDots({ repLogs }: SevenDayDotsProps) {
  // Build a map of date strings to rep logs (most recent per day)
  const repLogsByDate = new Map<string, RepLog>();
  for (const log of repLogs) {
    const dateStr = log.timestamp.split('T')[0];
    // Keep the most recent log for each day
    const existing = repLogsByDate.get(dateStr);
    if (!existing || log.timestamp > existing.timestamp) {
      repLogsByDate.set(dateStr, log);
    }
  }

  // Generate last 7 days (including today)
  const today = new Date();
  const todayStr = getDateString(today);
  const days: Array<{ date: Date; dateStr: string; label: string }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      dateStr: getDateString(date),
      label: getDayLabel(date),
    });
  }

  return (
    <div className="flex justify-center items-center gap-2">
      {days.map(({ dateStr, label }) => {
        const status = getDotStatus(dateStr, todayStr, repLogsByDate);
        const isToday = dateStr === todayStr;

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            {/* Day label - show "Today" for current day */}
            <span
              className={`text-xs ${
                isToday
                  ? 'font-semibold text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            >
              {isToday ? 'Today' : label}
            </span>

            {/* Dot */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isToday ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-primary)]' : ''
              }`}
            >
              {status === 'completed' && (
                <div className={`rounded-full bg-[var(--accent)] ${isToday ? 'w-5 h-5' : 'w-4 h-4'}`} />
              )}
              {status === 'missed' && (
                <div className={`rounded-full border-2 border-[var(--text-tertiary)] ${isToday ? 'w-5 h-5' : 'w-4 h-4'}`} />
              )}
              {(status === 'empty' || status === 'future') && (
                <div className={`rounded-full bg-[var(--bg-tertiary)] ${isToday ? 'w-3 h-3' : 'w-2 h-2'}`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
