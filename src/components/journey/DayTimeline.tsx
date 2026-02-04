'use client';

import { useRef, useEffect, useMemo } from 'react';
import { CheckIn } from '@/types/habit';
import DayCard from './DayCard';

interface DayTimelineProps {
  checkIns: CheckIn[];
  selectedDate?: string | null;
  onDayClick?: (checkIn: CheckIn) => void;
}

/**
 * DayTimeline - Scrollable list of day cards
 * Shows check-in history with most recent first
 */
export default function DayTimeline({
  checkIns,
  selectedDate,
  onDayClick,
}: DayTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Sort check-ins by date (most recent first)
  const sortedCheckIns = useMemo(() => {
    return [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  }, [checkIns]);

  // Get today's date string
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

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
  if (sortedCheckIns.length === 0) {
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
  if (sortedCheckIns.length <= 2) {
    return (
      <div className="space-y-3">
        <div className="text-center py-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            {sortedCheckIns.length === 1 ? 'Day 1 complete!' : `${sortedCheckIns.length} days in`} — keep going
          </p>
        </div>

        {sortedCheckIns.map((checkIn) => (
          <div
            key={checkIn.id}
            ref={checkIn.date === selectedDate ? selectedRef : undefined}
          >
            <DayCard
              checkIn={checkIn}
              isToday={checkIn.date === today}
              onClick={() => onDayClick?.(checkIn)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-medium text-[var(--text-secondary)]">
          Recent Days
        </h4>
        <span className="text-xs text-[var(--text-tertiary)]">
          {sortedCheckIns.length} entries
        </span>
      </div>

      {/* Timeline cards */}
      {sortedCheckIns.map((checkIn) => (
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
            onClick={() => onDayClick?.(checkIn)}
          />
        </div>
      ))}

      {/* Bottom spacer for scroll */}
      <div className="h-4" />
    </div>
  );
}
