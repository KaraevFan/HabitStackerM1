'use client';

import { useRouter } from 'next/navigation';
import { loadHabitData } from '@/lib/store/habitStore';
import { CoachNotes } from '@/types/habit';

function getInitialNotes(): CoachNotes | null {
  if (typeof window === 'undefined') return null;
  const data = loadHabitData();
  return data?.system?.coachNotes || null;
}

export default function CoachNotesPage() {
  const router = useRouter();
  const notes = getInitialNotes();

  if (!notes) {
    return (
      <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
        <div className="max-w-md mx-auto text-center">
          <button onClick={() => router.push('/')} className="text-sm text-[var(--accent-primary)] mb-8 block">&larr; Back</button>
          <p className="text-[var(--text-secondary)]">Coach&apos;s notes will appear after your intake conversation.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { title: 'Pattern I Noticed', content: notes.patternNoticed },
    { title: 'Why This Habit', content: notes.whyThisHabit },
    { title: 'The Science in 60 Seconds', content: notes.scienceIn60Seconds },
    { title: 'What to Watch For', content: notes.whatToWatchFor },
    { title: 'Your Edge', content: notes.yourEdge },
  ];

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="text-sm text-[var(--accent-primary)]">&larr; Back</button>
        </div>

        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">
          Coach&apos;s Notes
        </h1>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5">
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)] mb-2">
                {section.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}

          {/* Addenda */}
          {notes.addenda && notes.addenda.length > 0 && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5">
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)] mb-3">
                Updates
              </h2>
              <div className="space-y-3">
                {notes.addenda.map((addendum, i) => (
                  <div key={i} className="border-l-2 border-[var(--accent-primary)] pl-3">
                    <p className="text-sm text-[var(--text-secondary)]">{addendum.content}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {new Date(addendum.addedAt).toLocaleDateString()} &mdash; {addendum.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
