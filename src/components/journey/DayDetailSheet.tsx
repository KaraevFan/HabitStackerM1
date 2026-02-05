'use client';

import { useEffect, useCallback } from 'react';
import { CheckIn, getCheckInState, CheckInState } from '@/types/habit';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  checkIn: CheckIn | null;
  date: string | null; // YYYY-MM-DD
}

/**
 * Format date for the sheet header
 */
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format check-in time from ISO timestamp
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
 * Get status badge display info
 */
function getStatusBadge(state: CheckInState): {
  label: string;
  bgClass: string;
  textClass: string;
  message: string;
} {
  switch (state) {
    case 'completed':
      return {
        label: 'COMPLETED',
        bgClass: 'bg-[var(--accent-subtle)]',
        textClass: 'text-[var(--accent-primary)]',
        message: 'You showed up.',
      };
    case 'recovered':
      return {
        label: 'RECOVERED',
        bgClass: 'bg-[var(--accent-subtle)]',
        textClass: 'text-[var(--accent-primary)]',
        message: 'You got back on track.',
      };
    case 'no_trigger':
      return {
        label: 'SKIPPED',
        bgClass: 'bg-[var(--warning-subtle)]',
        textClass: 'text-[var(--warning)]',
        message: 'You acknowledged the day.',
      };
    case 'missed':
      return {
        label: 'MISSED',
        bgClass: 'bg-[var(--error-subtle)]',
        textClass: 'text-[var(--error)]',
        message: 'No check-in recorded.',
      };
    default:
      return {
        label: 'PENDING',
        bgClass: 'bg-[var(--bg-tertiary)]',
        textClass: 'text-[var(--text-tertiary)]',
        message: 'No check-in recorded.',
      };
  }
}

/**
 * Get full reflection text (not truncated)
 */
function getFullReflection(checkIn: CheckIn): string | null {
  if (checkIn.reflection?.summary) {
    return checkIn.reflection.summary;
  }

  if (checkIn.note) {
    return checkIn.note;
  }

  if (checkIn.conversation?.messages) {
    const userMessages = checkIn.conversation.messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const quickReplies = ['nope', 'all good', 'good', 'fine', 'okay', 'ok', 'yes', 'no',
        "that's it", 'done', 'skip', 'thanks', 'got it', 'sounds good',
        "i'm done", 'nothing else', "that's all"];

      const isQuickReply = (msg: string) => {
        const normalized = msg.toLowerCase().trim();
        return normalized.length < 15 && quickReplies.some(p => normalized.includes(p));
      };

      const substantive = userMessages.filter(m => !isQuickReply(m.content));
      if (substantive.length > 0) {
        return substantive.reduce((a, b) => b.content.length > a.content.length ? b : a).content;
      }
    }
  }

  return null;
}

/**
 * Difficulty dots display
 */
function DifficultyDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`size-2 rounded-full ${
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
 * DayDetailSheet — Bottom sheet modal for viewing day detail
 */
export default function DayDetailSheet({ isOpen, onClose, checkIn, date }: DayDetailSheetProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !date) return null;

  const state = checkIn ? getCheckInState(checkIn) : null;
  const badge = state ? getStatusBadge(state) : null;
  const reflection = checkIn ? getFullReflection(checkIn) : null;
  const difficulty = checkIn ? (checkIn.difficulty || checkIn.difficultyRating) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay)] z-[var(--z-overlay)] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[var(--z-sheet)] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${formatFullDate(date)}`}
      >
        <div className="bg-[var(--bg-primary)] rounded-t-2xl shadow-lg max-h-[80vh] overflow-y-auto safe-area-bottom">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-[var(--bg-tertiary)] rounded-full" />
          </div>

          <div className="px-6 pb-8">
            {/* Header: Date + Close */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {formatFullDate(date)}
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* No check-in state */}
            {!checkIn && (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--text-tertiary)]">
                  No check-in recorded.
                </p>
              </div>
            )}

            {/* Check-in detail */}
            {checkIn && badge && (
              <div className="space-y-5">
                {/* Status badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.bgClass} ${badge.textClass}`}>
                    {badge.label}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {badge.message}
                  </span>
                </div>

                {/* Quantitative value */}
                {checkIn.reflection?.quantitative && (
                  <div className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                    {checkIn.reflection.quantitative}
                  </div>
                )}

                {/* Reflection section */}
                {reflection && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                      Your Reflection
                    </p>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                      {reflection}
                    </p>
                  </div>
                )}

                {/* Miss reason */}
                {state === 'missed' && checkIn.missReason && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                      Reason
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {checkIn.missReason}
                    </p>
                  </div>
                )}

                {/* Difficulty */}
                {difficulty && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-tertiary)]">Difficulty:</span>
                    <DifficultyDots rating={difficulty} />
                  </div>
                )}

                {/* Context tags */}
                {checkIn.contextTags && checkIn.contextTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {checkIn.contextTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Logged time */}
                <div className="pt-2 border-t border-[var(--bg-tertiary)]">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Logged at {formatTime(checkIn.checkedInAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
