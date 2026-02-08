'use client';

import { useRef, useEffect, useMemo } from 'react';
import { CheckIn } from '@/types/habit';
import { getLocalDateString } from '@/lib/dateUtils';
import DayCard from './DayCard';

interface DayTimelineProps {
  checkIns: CheckIn[];
  selectedDate?: string | null;
  onDayClick?: (date: string) => void;
}

/**
 * DayTimeline - Scrollable list of day cards
 * Shows "Your Week" — last 7 days of check-ins
 */
export default function DayTimeline({
  checkIns,
  selectedDate,
  onDayClick,
}: DayTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Deduplicate by date (keep latest check-in per date), sort by date descending, limit to 7
  const recentCheckIns = useMemo(() => {
    const byDate = new Map<string, CheckIn>();
    for (const checkIn of checkIns) {
      const existing = byDate.get(checkIn.date);
      if (!existing || checkIn.checkedInAt > existing.checkedInAt) {
        byDate.set(checkIn.date, checkIn);
      }
    }
    return [...byDate.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [checkIns]);

  // Get today's date string
  const today = useMemo(() => getLocalDateString(), []);

  // Scroll to selected date when it changes
  useEffect(() => {
    if (selectedDate && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedDate]);

  // Empty state
  if (recentCheckIns.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl mb-4">🌱</div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          Your journey is just beginning
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
          Each day you check in adds to your story. Complete your first rep to see it here.
        </p>
      </div>
    );
  }

  // Few entries state (1-2 days)
  if (recentCheckIns.length <= 2) {
    return (
      <div className="space-y-3">
        <div className="text-center py-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            {recentCheckIns.length === 1 ? 'Day 1 complete!' : `${recentCheckIns.length} days in`} — keep going
          </p>
        </div>

        {recentCheckIns.map((checkIn) => (
          <div
            key={checkIn.id}
            ref={checkIn.date === selectedDate ? selectedRef : undefined}
          >
            <DayCard
              checkIn={checkIn}
              isToday={checkIn.date === today}
              onClick={() => onDayClick?.(checkIn.date)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-3">
      {/* Section header */}
      <div className="px-1">
        <h4 className="text-sm font-medium text-[var(--text-secondary)]">
          Your Week
        </h4>
      </div>

      {/* Timeline cards */}
      {recentCheckIns.map((checkIn) => (
        <div
          key={checkIn.id}
          ref={checkIn.date === selectedDate ? selectedRef : undefined}
          className={`transition-all ${
            checkIn.date === selectedDate
              ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)] rounded-xl'
              : ''
          }`}
        >
          <DayCard
            checkIn={checkIn}
            isToday={checkIn.date === today}
            onClick={() => onDayClick?.(checkIn.date)}
          />
        </div>
      ))}

      {/* Bottom spacer for scroll */}
      <div className="h-4" />
    </div>
  );
}
