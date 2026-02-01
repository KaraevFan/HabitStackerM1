'use client';

import { RepLog, CheckIn, getCheckInState } from '@/types/habit';

interface SevenDayDotsProps {
  repLogs?: RepLog[];
  checkIns?: CheckIn[];
  isReactive?: boolean;
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

type DotState = 'completed' | 'recovered' | 'missed' | 'no_trigger' | 'empty' | 'future';

/**
 * Determine dot status for a given date using check-ins
 */
function getDotStateFromCheckIn(
  dateStr: string,
  today: string,
  checkInsByDate: Map<string, CheckIn>
): DotState {
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
 * Determine dot status for a given date using legacy repLogs
 */
function getDotStateFromRepLog(
  dateStr: string,
  today: string,
  repLogsByDate: Map<string, RepLog>
): DotState {
  // Future dates
  if (dateStr > today) {
    return 'future';
  }

  const log = repLogsByDate.get(dateStr);
  if (!log) {
    return 'empty';
  }

  if (log.type === 'done') {
    return 'completed';
  }
  if (log.type === 'recovery') {
    return 'recovered';
  }
  if (log.type === 'missed') {
    return 'missed';
  }

  return 'empty';
}

/**
 * Get visual representation for dot state
 */
function getDotVisual(
  state: DotState,
  isReactive: boolean,
  isToday: boolean
): { symbol: string | null; className: string } {
  const baseSize = isToday ? 'w-5 h-5' : 'w-4 h-4';
  const smallSize = isToday ? 'w-3 h-3' : 'w-2 h-2';

  if (isReactive) {
    // Reactive habits: distinct symbols
    switch (state) {
      case 'no_trigger':
        return {
          symbol: '🌙',
          className: `${baseSize} flex items-center justify-center text-sm`,
        };
      case 'completed':
        return {
          symbol: '✓',
          className: `${baseSize} flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold`,
        };
      case 'recovered':
        return {
          symbol: '→',
          className: `${baseSize} flex items-center justify-center rounded-full bg-[var(--accent-secondary)] text-white text-xs`,
        };
      case 'missed':
        return {
          symbol: '✗',
          className: `${baseSize} flex items-center justify-center text-[var(--text-tertiary)] text-xs`,
        };
      default:
        return {
          symbol: null,
          className: `${smallSize} rounded-full bg-[var(--bg-tertiary)]`,
        };
    }
  } else {
    // Time/event habits: simple dots
    switch (state) {
      case 'completed':
      case 'recovered':
        return {
          symbol: null,
          className: `${baseSize} rounded-full bg-[var(--accent-primary)]`,
        };
      case 'missed':
        return {
          symbol: null,
          className: `${baseSize} rounded-full border-2 border-[var(--text-tertiary)]`,
        };
      default:
        return {
          symbol: null,
          className: `${smallSize} rounded-full bg-[var(--bg-tertiary)]`,
        };
    }
  }
}

/**
 * SevenDayDots - Visual 7-day rolling history
 * Shows rep completion status without streak framing
 * Supports both legacy repLogs and new checkIns
 */
export default function SevenDayDots({
  repLogs = [],
  checkIns = [],
  isReactive = false,
}: SevenDayDotsProps) {
  // Build maps for lookup
  const checkInsByDate = new Map<string, CheckIn>();
  for (const checkIn of checkIns) {
    const dateStr = checkIn.date;
    // Keep the most recent for each day
    const existing = checkInsByDate.get(dateStr);
    if (!existing || checkIn.checkedInAt > existing.checkedInAt) {
      checkInsByDate.set(dateStr, checkIn);
    }
  }

  const repLogsByDate = new Map<string, RepLog>();
  for (const log of repLogs) {
    const dateStr = log.timestamp.split('T')[0];
    const existing = repLogsByDate.get(dateStr);
    if (!existing || log.timestamp > existing.timestamp) {
      repLogsByDate.set(dateStr, log);
    }
  }

  // Prefer checkIns if available
  const useCheckIns = checkIns.length > 0;

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
        const state = useCheckIns
          ? getDotStateFromCheckIn(dateStr, todayStr, checkInsByDate)
          : getDotStateFromRepLog(dateStr, todayStr, repLogsByDate);

        const isToday = dateStr === todayStr;
        const visual = getDotVisual(state, isReactive, isToday);

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            {/* Day label */}
            <span
              className={`text-xs ${
                isToday
                  ? 'font-semibold text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            >
              {isToday ? 'Today' : label}
            </span>

            {/* Dot/Symbol */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isToday
                  ? 'ring-2 ring-[var(--accent-primary)] ring-offset-1 ring-offset-[var(--bg-primary)]'
                  : ''
              }`}
            >
              <div className={visual.className}>
                {visual.symbol}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
