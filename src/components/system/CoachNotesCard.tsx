'use client';

import Link from 'next/link';
import { CoachNotes } from '@/types/habit';

interface CoachNotesCardProps {
  notes: CoachNotes | undefined;
}

export default function CoachNotesCard({ notes }: CoachNotesCardProps) {
  if (!notes) return null;

  return (
    <Link href="/coach-notes" className="block">
      <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
              Coach&apos;s Notes
            </p>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
              {notes.patternNoticed}
            </p>
          </div>
          <span className="text-[var(--accent-primary)] text-sm">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
