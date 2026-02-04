'use client';

import { useMemo } from 'react';
import { CheckIn, getCheckInState } from '@/types/habit';

interface NarrativeHeaderProps {
  checkIns: CheckIn[];
  startDate: string; // ISO date (YYYY-MM-DD)
}

/**
 * Calculate "showing up" percentage — any engagement counts
 * (completed + recovered + no_trigger) / total days since start
 */
function calculateShowingUp(checkIns: CheckIn[], startDate: string): { percent: number; engaged: number; total: number } {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Count engaged days (done, recovered, or no_trigger)
  const engagedDates = new Set<string>();
  for (const checkIn of checkIns) {
    const state = getCheckInState(checkIn);
    if (state === 'completed' || state === 'recovered' || state === 'no_trigger') {
      engagedDates.add(checkIn.date);
    }
  }

  const engaged = engagedDates.size;
  const percent = Math.round((engaged / totalDays) * 100);

  return { percent, engaged, total: totalDays };
}

/**
 * Get contextual insight text
 */
function getInsight(checkIns: CheckIn[], startDate: string, percent: number, engaged: number, total: number): string {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isWeek1 = daysSinceStart <= 7;

  // Check for recent recovery
  const hasRecentRecovery = checkIns.some((c) => {
    const state = getCheckInState(c);
    if (state !== 'recovered') return false;
    const checkInDate = new Date(c.date + 'T00:00:00');
    const daysAgo = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo <= 3;
  });

  if (hasRecentRecovery) {
    return 'Getting back on track is the hardest part. You did it.';
  }

  if (isWeek1 && percent >= 70) {
    return "That's better than most Week 1s.";
  }

  if (isWeek1 && percent < 70) {
    return 'Week 1 is about finding your rhythm.';
  }

  return `You've shown up ${engaged} of ${total} days since starting.`;
}

/**
 * MomentumRing — SVG circle showing "showing up" percentage
 */
function MomentumRing({ percent }: { percent: number }) {
  const radius = 40;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const size = (radius + stroke) * 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bg-tertiary)"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
      {/* Percentage text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize="18"
        fontWeight="600"
        fontFamily="var(--font-outfit), Outfit, sans-serif"
      >
        {percent}%
      </text>
    </svg>
  );
}

/**
 * NarrativeHeader — Momentum ring + contextual insight
 */
export default function NarrativeHeader({ checkIns, startDate }: NarrativeHeaderProps) {
  const { percent, engaged, total } = useMemo(
    () => calculateShowingUp(checkIns, startDate),
    [checkIns, startDate]
  );

  const insight = useMemo(
    () => getInsight(checkIns, startDate, percent, engaged, total),
    [checkIns, startDate, percent, engaged, total]
  );

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
      <MomentumRing percent={percent} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
          Showing up
        </p>
        <p className="text-sm italic text-[var(--accent-primary)] leading-relaxed">
          {insight}
        </p>
      </div>
    </div>
  );
}
