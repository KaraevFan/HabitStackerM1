'use client';

import { CheckIn, getCheckInState, CheckInState } from '@/types/habit';
import { getYesterdayDateString } from '@/lib/dateUtils';

interface DayCardProps {
  checkIn: CheckIn;
  isToday?: boolean;
  onClick?: () => void;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string, isToday: boolean): string {
  if (isToday) return 'Today';

  const date = new Date(dateStr + 'T00:00:00');

  if (dateStr === getYesterdayDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format check-in time
 */
function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get status display info — using CSS variables consistently
 */
function getStatusDisplay(state: CheckInState): {
  label: string;
  icon: string;
  color: string;
} {
  switch (state) {
    case 'completed':
      return { label: 'Done', icon: '✓', color: 'text-[var(--accent-primary)]' };
    case 'recovered':
      return { label: 'Recovered', icon: '↩', color: 'text-[var(--accent-primary)]' };
    case 'missed':
      return { label: 'Missed', icon: '—', color: 'text-[var(--error)]' };
    case 'no_trigger':
      return { label: 'Skipped', icon: '○', color: 'text-[var(--warning)]' };
    default:
      return { label: 'Pending', icon: '○', color: 'text-[var(--text-tertiary)]' };
  }
}

/**
 * Get reflection display from AI-extracted summary or fallback to raw messages
 */
function getReflectionDisplay(checkIn: CheckIn): string | null {
  // First priority: AI-extracted reflection summary
  if (checkIn.reflection?.summary) {
    const summary = checkIn.reflection.summary;
    return summary.length > 60 ? summary.substring(0, 60) + '...' : summary;
  }

  // Second priority: user note
  if (checkIn.note) {
    return checkIn.note.length > 60 ? checkIn.note.substring(0, 60) + '...' : checkIn.note;
  }

  // Fallback: extract from conversation messages
  if (checkIn.conversation?.messages) {
    const userMessages = checkIn.conversation.messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      // Quick-reply phrases to filter out
      const quickReplies = ['nope', 'all good', 'good', 'fine', 'okay', 'ok', 'yes', 'no',
        "that's it", 'done', 'skip', 'thanks', 'got it', 'sounds good',
        "i'm done", 'nothing else', "that's all"];

      const isQuickReply = (msg: string) => {
        const normalized = msg.toLowerCase().trim();
        return normalized.length < 15 && quickReplies.some(p => normalized.includes(p));
      };

      // Find the most substantive message
      const substantive = userMessages.filter(m => !isQuickReply(m.content));
      const best = substantive.length > 0
        ? substantive.reduce((a, b) => b.content.length > a.content.length ? b : a).content
        : userMessages.reduce((a, b) => b.content.length > a.content.length ? b : a).content;

      return best.length > 60 ? best.substring(0, 60) + '...' : best;
    }
  }

  return null;
}

/**
 * Render difficulty dots
 */
function DifficultyDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`w-1.5 h-1.5 rounded-full ${
            level <= rating
              ? 'bg-[var(--accent-primary)]'
              : 'bg-[var(--bg-tertiary)]'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * DayCard - Individual day entry in the timeline
 * Tapping opens DayDetailSheet (no inline expansion)
 */
export default function DayCard({ checkIn, isToday = false, onClick }: DayCardProps) {
  const state = getCheckInState(checkIn);
  const status = getStatusDisplay(state);
  const difficulty = checkIn.difficulty || checkIn.difficultyRating;
  const reflection = getReflectionDisplay(checkIn);
  const sentiment = checkIn.reflection?.sentiment;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all
        ${isToday
          ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
          : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'
        }
      `}
    >
      {/* Header: Date + Status + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
            {formatDate(checkIn.date, isToday)}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            at {formatTime(checkIn.checkedInAt)}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
          <span>{status.icon}</span>
          <span>{status.label}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-2">
        {/* Quantitative value (from AI extraction or regex fallback) */}
        {(checkIn.reflection?.quantitative || (checkIn.note && /[¥$€£]?\d+/.test(checkIn.note))) && (
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {checkIn.reflection?.quantitative || checkIn.note?.match(/[¥$€£]?[\d,]+(?:\.\d+)?/)?.[0] || ''}
          </div>
        )}

        {/* Reflection snippet with sentiment indicator */}
        {reflection && (
          <div className="flex items-start gap-2">
            {sentiment && (
              <span className="flex-shrink-0 mt-0.5">
                {sentiment === 'positive' && '😊'}
                {sentiment === 'challenging' && '😤'}
                {sentiment === 'neutral' && '📝'}
              </span>
            )}
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
              {reflection}
            </p>
          </div>
        )}

        {/* Miss reason if missed */}
        {state === 'missed' && checkIn.missReason && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Reason: {checkIn.missReason}
          </p>
        )}

        {/* Footer: Difficulty */}
        {difficulty && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[var(--text-tertiary)]">Difficulty:</span>
            <DifficultyDots rating={difficulty} />
          </div>
        )}

        {/* Context tags if any */}
        {checkIn.contextTags && checkIn.contextTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {checkIn.contextTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
