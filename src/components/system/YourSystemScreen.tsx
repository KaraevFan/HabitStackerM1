'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HabitSystem, getHabitEmoji, normalizeThenSteps } from '@/types/habit';
import EditBottomSheet from './EditBottomSheet';
import CoachNotesCard from './CoachNotesCard';

/**
 * Format 24h time string to 12h format
 */
function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface YourSystemScreenProps {
  system: HabitSystem;
  onUpdateSystem: (updates: Partial<HabitSystem>) => void;
}

type EditField =
  | 'anchor'
  | 'action'
  | 'then'
  | 'tinyVersion'
  | 'environmentPrime'
  | 'frictionReduced'
  | 'recovery'
  | null;

const EDIT_CONFIGS: Record<
  Exclude<EditField, null>,
  { title: string; description: string; placeholder: string }
> = {
  anchor: {
    title: 'Edit anchor',
    description: 'The trigger that reminds you to do your habit.',
    placeholder: 'After I...',
  },
  action: {
    title: 'Edit action',
    description: 'The habit action itself. Keep it under 2 minutes.',
    placeholder: 'I will...',
  },
  then: {
    title: 'Edit follow-up steps',
    description: 'What happens after you complete your habit? One step per line.',
    placeholder: 'Add event to calendar\nBlock the time',
  },
  tinyVersion: {
    title: 'Edit tiny version',
    description: "What's the smallest version of this habit that still counts? Think 30 seconds or less.",
    placeholder: 'Just...',
  },
  environmentPrime: {
    title: 'Edit environment prime',
    description: 'What can you set up the night before to make tomorrow easier?',
    placeholder: 'The night before, I...',
  },
  frictionReduced: {
    title: 'Edit friction notes',
    description: 'What barriers have you removed or worked around?',
    placeholder: 'I removed friction by...',
  },
  recovery: {
    title: 'Edit recovery',
    description: 'What do you do when you miss? Keep it gentle and under 30 seconds.',
    placeholder: 'If I miss, I just...',
  },
};

export default function YourSystemScreen({
  system,
  onUpdateSystem,
}: YourSystemScreenProps) {
  const router = useRouter();
  const [editField, setEditField] = useState<EditField>(null);
  const [whyExpanded, setWhyExpanded] = useState(false);

  const emoji = getHabitEmoji(system.anchor, system.action);
  const hasToolkit =
    system.tinyVersion || system.environmentPrime || system.frictionReduced;

  const handleEdit = (field: EditField) => {
    setEditField(field);
  };

  const handleSave = (value: string) => {
    if (editField) {
      // Handle 'then' field specially - convert to array
      if (editField === 'then') {
        const steps = value.split('\n').map(s => s.trim()).filter(Boolean);
        onUpdateSystem({ then: steps.length > 0 ? steps : undefined });
      } else {
        onUpdateSystem({ [editField]: value });
      }
    }
    setEditField(null);
  };

  const getFieldValue = (field: Exclude<EditField, null>): string => {
    // Handle 'then' field specially - convert array to newline-separated string
    if (field === 'then') {
      return normalizeThenSteps(system.then).join('\n');
    }
    return (system[field] as string) || '';
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--bg-tertiary)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Today
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 py-6 text-center border-b border-[var(--bg-tertiary)]">
          <h1 className="text-2xl font-serif text-[var(--text-primary)]">
            Your System
          </h1>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* The Ritual Card */}
          <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
              The Ritual
            </p>

            {/* Flow visualization */}
            <div className="space-y-3">
              {/* Anchor */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-lg">
                  {emoji}
                </div>
                <p className="flex-1 text-[var(--text-primary)]">
                  {system.anchor}
                </p>
              </div>

              {/* Arrow */}
              <div className="ml-4 h-4 w-0.5 bg-[var(--bg-tertiary)]" />

              {/* Action */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-lg">
                  →
                </div>
                <p className="flex-1 text-[var(--text-primary)]">
                  {system.action}
                </p>
              </div>

              {/* Then (if present) */}
              {system.then && normalizeThenSteps(system.then).length > 0 && (
                <>
                  <div className="ml-4 h-4 w-0.5 bg-[var(--bg-tertiary)]" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-lg flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 text-[var(--text-primary)]">
                      {normalizeThenSteps(system.then).length === 1 ? (
                        <p>{normalizeThenSteps(system.then)[0]}</p>
                      ) : (
                        <ul className="space-y-1">
                          {normalizeThenSteps(system.then).map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[var(--text-tertiary)]">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reminder time if set */}
            {system.reminderTime && (
              <div className="mt-4 pt-4 border-t border-[var(--bg-tertiary)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span>⏰</span>
                  <span>
                    Daily reminder: {formatTime(system.reminderTime)}
                    {system.reminderLabel && ` "${system.reminderLabel}"`}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Push notifications coming soon
                </p>
              </div>
            )}

            {/* Edit link */}
            <div className="mt-4 pt-4 border-t border-[var(--bg-tertiary)] flex justify-end">
              <button
                onClick={() => handleEdit('action')}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Edit ritual →
              </button>
            </div>
          </div>

          {/* Your Toolkit Card */}
          {hasToolkit && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                Your Toolkit
              </p>

              <div className="space-y-4">
                {/* Tiny Version */}
                {system.tinyVersion && (
                  <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚡</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Tiny version
                      </span>
                    </div>
                    <p className="text-[var(--text-primary)] mb-1">
                      &ldquo;{system.tinyVersion}&rdquo;
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      For days when everything&apos;s against you. Still counts.
                    </p>
                    <button
                      onClick={() => handleEdit('tinyVersion')}
                      className="mt-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      Edit →
                    </button>
                  </div>
                )}

                {/* Environment Prime */}
                {system.environmentPrime && (
                  <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌙</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Environment prime
                      </span>
                    </div>
                    <p className="text-[var(--text-primary)] mb-1">
                      &ldquo;{system.environmentPrime}&rdquo;
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Set yourself up so the right choice is easy.
                    </p>
                    <button
                      onClick={() => handleEdit('environmentPrime')}
                      className="mt-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      Edit →
                    </button>
                  </div>
                )}

                {/* Friction Reduced */}
                {system.frictionReduced && (
                  <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔓</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Friction reduced
                      </span>
                    </div>
                    <p className="text-[var(--text-primary)] mb-1">
                      &ldquo;{system.frictionReduced}&rdquo;
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Removed barriers between you and the habit.
                    </p>
                    <button
                      onClick={() => handleEdit('frictionReduced')}
                      className="mt-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      Edit →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* When You Miss Card */}
          <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[#FDF8F4] p-6">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
              When You Miss
            </p>

            <p className="text-[var(--text-primary)] mb-2">
              &ldquo;{system.recovery}&rdquo;
            </p>

            <p className="text-sm italic text-[var(--text-tertiary)]">
              Missing once is an accident. Missing twice is a new habit forming.
            </p>

            <button
              onClick={() => handleEdit('recovery')}
              className="mt-4 text-sm text-[var(--accent)] hover:underline"
            >
              Edit →
            </button>
          </div>

          {/* Why This Works (Collapsible) - Layer 2 Education */}
          {(system.whyItFits?.length || system.principle) && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] overflow-hidden">
              <button
                onClick={() => setWhyExpanded(!whyExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Why this approach works
                </p>
                <span className="text-[var(--text-tertiary)]">
                  {whyExpanded ? '▲' : '▼'}
                </span>
              </button>

              {whyExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {/* The Principle - behavioral science insight */}
                  {system.principle && (
                    <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                        The Principle
                      </p>
                      <p className="text-[var(--text-primary)] italic">
                        &ldquo;{system.principle}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Why it fits your situation */}
                  {system.whyItFits && system.whyItFits.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                        Why it fits your situation
                      </p>
                      <ul className="space-y-2">
                        {system.whyItFits.map((reason, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-[var(--text-secondary)]"
                          >
                            <span className="text-[var(--text-tertiary)]">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expectations preview */}
                  {system.expectations && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                        What to expect
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {system.expectations}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Coach's Notes */}
          <CoachNotesCard notes={system.coachNotes} />

          {/* Re-tune CTA - De-emphasized */}
          <div className="pt-4">
            <button
              onClick={() => router.push('/tuneup')}
              className="w-full py-3 px-4 text-sm text-[var(--text-secondary)] border border-[var(--bg-tertiary)] rounded-lg hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Re-tune your system
            </button>
          </div>
        </div>
      </div>

      {/* Edit Bottom Sheet */}
      {editField && (
        <EditBottomSheet
          isOpen={!!editField}
          onClose={() => setEditField(null)}
          onSave={handleSave}
          title={EDIT_CONFIGS[editField].title}
          description={EDIT_CONFIGS[editField].description}
          placeholder={EDIT_CONFIGS[editField].placeholder}
          initialValue={getFieldValue(editField)}
        />
      )}
    </div>
  );
}
