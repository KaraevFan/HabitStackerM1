"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { HabitData, getPlanScreenState, getHabitEmoji } from "@/types/habit";

interface PlanScreenProps {
  habitData: HabitData;
}

function formatLastDone(lastDoneDate: string | null): string {
  if (!lastDoneDate) return "—";

  const today = new Date().toISOString().split("T")[0];
  if (lastDoneDate === today) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  if (lastDoneDate === yesterdayStr) return "Yesterday";

  const date = new Date(lastDoneDate);
  const diffDays = Math.floor(
    (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `${diffDays} days ago`;
}

export default function PlanScreen({ habitData }: PlanScreenProps) {
  const { snapshot, planDetails, system, repsCount, lastDoneDate } = habitData;

  // Get habit info - prefer system (from intake agent), fall back to planDetails (legacy)
  const anchor = system?.anchor || planDetails?.anchor;
  const action = system?.action || planDetails?.action;

  if (!anchor || !action) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">No plan found. Please set up your habit.</p>
      </div>
    );
  }

  // Get plan screen state for conditional rendering
  const planState = getPlanScreenState(habitData);
  const emoji = getHabitEmoji(anchor, action);

  // Generate hero statement
  let cleanAnchor = anchor.replace(/^after\s+/i, '').trim();
  cleanAnchor = cleanAnchor.charAt(0).toLowerCase() + cleanAnchor.slice(1);
  let cleanAction = action.trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);
  const heroStatement = `When I ${cleanAnchor}, I ${cleanAction}.`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
              Your Habit
            </p>
          </div>

          {/* Habit Card */}
          <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {/* Emoji */}
            <div className="text-4xl mb-4" role="img" aria-label="habit icon">
              {emoji}
            </div>

            {/* Hero Statement */}
            <p className="text-lg font-serif text-[var(--text-primary)] leading-relaxed">
              &ldquo;{heroStatement}&rdquo;
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {repsCount}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">Reps</p>
            </div>
            <div className="w-px bg-[var(--bg-tertiary)]" />
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {formatLastDone(lastDoneDate)}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">Last done</p>
            </div>
            {planState === 'tuned' && (
              <>
                <div className="w-px bg-[var(--bg-tertiary)]" />
                <div>
                  <Link
                    href="/system"
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    View system →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <Link href="/today" className="block">
            <Button size="lg" variant="primary" className="w-full">
              Mark today&apos;s rep
            </Button>
          </Link>

          {/* Conditional Cards Based on Plan State */}

          {/* Tune-Up Available Card */}
          {planState === 'tune_up_available' && (
            <Link href="/tuneup" className="block">
              <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-subtle)] p-5">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">🎉</span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      You did your first rep!
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Let&apos;s set up your system so it keeps going.
                    </p>
                    <span className="text-sm font-medium text-[var(--accent)]">
                      Tune your system →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Needs Photo Card */}
          {planState === 'needs_photo_for_tuneup' && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📸</span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    Add a photo to unlock tuning
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    After your next rep, snap a quick photo as proof. This unlocks
                    personalized system tuning.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Week reminder (if snapshot exists) */}
          {snapshot && (
            <p className="text-center text-sm text-[var(--text-tertiary)]">
              {snapshot.line1}
            </p>
          )}

          {/* Why it works */}
          <details className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
            <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
              Why this works
            </summary>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Tiny actions attached to existing routines are nearly impossible to skip.
              If you do miss, the 30-second recovery brings you right back.
              No lost progress—just continuity.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
