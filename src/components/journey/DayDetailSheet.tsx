'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckIn, HabitType, getCheckInState, CheckInState, HabitData } from '@/types/habit';
import { logBackfillCheckIn } from '@/lib/store/habitStore';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  checkIn: CheckIn | null;
  date: string | null; // YYYY-MM-DD
  habitType?: HabitType;
  onSave?: (updated: HabitData) => void;
}

type SheetMode = 'view' | 'add' | 'edit';
type StatusChoice = 'done' | 'missed' | 'no_trigger';

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
 * Difficulty dots display (read-only)
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
 * Status pill selector for add/edit modes
 */
function StatusSelector({
  selected,
  onChange,
  showNoTrigger,
}: {
  selected: StatusChoice | null;
  onChange: (s: StatusChoice) => void;
  showNoTrigger: boolean;
}) {
  const options: { value: StatusChoice; label: string }[] = [
    { value: 'done', label: 'Done' },
    { value: 'missed', label: 'Missed' },
  ];
  if (showNoTrigger) {
    options.push({ value: 'no_trigger', label: 'No trigger' });
  }

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            selected === opt.value
              ? opt.value === 'done'
                ? 'bg-[var(--accent-primary)] text-white'
                : opt.value === 'missed'
                  ? 'bg-[var(--error)] text-white'
                  : 'bg-[var(--warning)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Difficulty selector (interactive circles)
 */
function DifficultySelector({
  selected,
  onChange,
}: {
  selected: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
        Difficulty (optional)
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`size-8 rounded-full text-sm font-medium transition-colors ${
              selected === level
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * DayDetailSheet — Bottom sheet modal for viewing/adding/editing day detail
 */
export default function DayDetailSheet({ isOpen, onClose, checkIn, date, habitType, onSave }: DayDetailSheetProps) {
  const [mode, setMode] = useState<SheetMode>('view');
  const [selectedStatus, setSelectedStatus] = useState<StatusChoice | null>(null);
  const [note, setNote] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);

  // Reset form state when sheet opens for a new date
  // (matches the existing codebase pattern for initializing state in effects)
  useEffect(() => {
    if (isOpen && date) {
      if (!checkIn) {
        setMode('add');
        setSelectedStatus(null);
        setNote('');
        setDifficulty(null);
      } else {
        setMode('view');
      }
    }
  }, [isOpen, date, checkIn]);

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
  const existingDifficulty = checkIn ? (checkIn.difficulty || checkIn.difficultyRating) : null;
  const isReactive = habitType === 'reactive';

  const switchToEdit = () => {
    if (!checkIn) return;
    // Pre-populate form from existing check-in
    const checkInState = getCheckInState(checkIn);
    if (checkInState === 'completed' || checkInState === 'recovered') {
      setSelectedStatus('done');
    } else if (checkInState === 'missed') {
      setSelectedStatus('missed');
    } else if (checkInState === 'no_trigger') {
      setSelectedStatus('no_trigger');
    }
    setNote(checkIn.note || '');
    setDifficulty(checkIn.difficulty || checkIn.difficultyRating || null);
    setMode('edit');
  };

  const handleSave = () => {
    if (!selectedStatus || !date) return;

    const data: Parameters<typeof logBackfillCheckIn>[1] = {
      triggerOccurred: selectedStatus !== 'no_trigger',
      actionTaken: selectedStatus === 'done',
      note: note.trim() || undefined,
      difficulty: (selectedStatus === 'done' && difficulty ? difficulty : undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
    };

    const updated = logBackfillCheckIn(date, data);
    onSave?.(updated);
  };

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

            {/* ===== ADD MODE ===== */}
            {mode === 'add' && (
              <div className="space-y-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Add a check-in for this day.
                </p>

                {/* Status selector */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                    What happened?
                  </p>
                  <StatusSelector
                    selected={selectedStatus}
                    onChange={setSelectedStatus}
                    showNoTrigger={isReactive}
                  />
                </div>

                {/* Difficulty — only for "done" */}
                {selectedStatus === 'done' && (
                  <DifficultySelector selected={difficulty} onChange={setDifficulty} />
                )}

                {/* Note */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                    Note (optional)
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything you want to remember..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={!selectedStatus}
                  className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${
                    selectedStatus
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                  }`}
                >
                  Save check-in
                </button>
              </div>
            )}

            {/* ===== VIEW MODE ===== */}
            {mode === 'view' && checkIn && badge && (
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
                {existingDifficulty && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-tertiary)]">Difficulty:</span>
                    <DifficultyDots rating={existingDifficulty} />
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

                {/* Logged time + Edit link */}
                <div className="pt-2 border-t border-[var(--bg-tertiary)] flex items-center justify-between">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Logged at {formatTime(checkIn.checkedInAt)}
                  </p>
                  {onSave && (
                    <button
                      onClick={switchToEdit}
                      className="text-xs text-[var(--accent-primary)] hover:underline"
                    >
                      Edit this entry
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ===== EDIT MODE ===== */}
            {mode === 'edit' && (
              <div className="space-y-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Edit this check-in.
                </p>

                {/* Status selector */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                    What happened?
                  </p>
                  <StatusSelector
                    selected={selectedStatus}
                    onChange={setSelectedStatus}
                    showNoTrigger={isReactive}
                  />
                </div>

                {/* Difficulty — only for "done" */}
                {selectedStatus === 'done' && (
                  <DifficultySelector selected={difficulty} onChange={setDifficulty} />
                )}

                {/* Note */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                    Note (optional)
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything you want to remember..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                {/* Save + Cancel */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 py-3 text-sm font-medium rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!selectedStatus}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors ${
                      selectedStatus
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                    }`}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
