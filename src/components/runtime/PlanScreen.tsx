"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SevenDayDots from "@/components/journey/SevenDayDots";
import IdentitySection from "@/components/self/IdentitySection";
import ProgressionSection from "@/components/self/ProgressionSection";
import SetupChecklist from "@/components/system/SetupChecklist";
import { HabitData, getPlanScreenState, getHabitEmoji, getSetupProgress, normalizeThenSteps } from "@/types/habit";
import { toggleSetupItem, markSetupItemNA } from "@/lib/store/habitStore";

interface PlanScreenProps {
  habitData: HabitData;
}

type TabId = 'system' | 'journey' | 'self' | null;

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

export default function PlanScreen({ habitData: initialHabitData }: PlanScreenProps) {
  const [habitData, setHabitData] = useState(initialHabitData);
  const [activeTab, setActiveTab] = useState<TabId>(null);

  const { snapshot, planDetails, system, repsCount, lastDoneDate, createdAt } = habitData;

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
  // Clean anchor: remove "after", time qualifiers (tonight, today, etc.), and "you" → "I"
  let cleanAnchor = anchor
    .replace(/^(after|when)\s+/i, '')
    .replace(/^(tonight|today|tomorrow|this evening|this morning)\s+/i, '')
    .replace(/^(after|when)\s+/i, '') // Remove again in case time qualifier was first
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();
  cleanAnchor = cleanAnchor.charAt(0).toLowerCase() + cleanAnchor.slice(1);

  let cleanAction = action
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);
  const heroStatement = `When I ${cleanAnchor}, I ${cleanAction}.`;

  // Setup checklist handlers
  const handleToggleSetupItem = (itemId: string) => {
    const updated = toggleSetupItem(itemId);
    setHabitData(updated);
  };

  const handleMarkSetupItemNA = (itemId: string) => {
    const updated = markSetupItemNA(itemId);
    setHabitData(updated);
  };

  // Toggle tab
  const handleTabClick = (tabId: TabId) => {
    setActiveTab(activeTab === tabId ? null : tabId);
  };

  // Check if setup checklist is incomplete
  const setupProgress = getSetupProgress(system?.setupChecklist);
  const hasIncompleteSetup = setupProgress.total > 0 && setupProgress.completed < setupProgress.total;
  const isPreFirstRep = planState === 'pre_first_rep';

  // Check if identity is available and user has done first rep
  const hasIdentity = !!system?.identity;
  const hasCompletedFirstRep = repsCount > 0;

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

          {/* 7-Day Dots */}
          <SevenDayDots repLogs={habitData.repLogs || []} />

          {/* Stats */}
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {repsCount}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">{repsCount === 1 ? 'Rep' : 'Reps'}</p>
            </div>
            <div className="w-px bg-[var(--bg-tertiary)]" />
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {formatLastDone(lastDoneDate)}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">Last done</p>
            </div>
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

          {/* Contextual Cards */}

          {/* Setup checklist card (pre-first-rep or incomplete) */}
          {(isPreFirstRep || hasIncompleteSetup) && setupProgress.total > 0 && activeTab !== 'system' && (
            <button
              onClick={() => setActiveTab('system')}
              className="w-full text-left rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚙️</span>
                  <span className="text-sm text-[var(--text-primary)]">
                    Complete your setup ({setupProgress.completed}/{setupProgress.total})
                  </span>
                </div>
                <span className="text-sm text-[var(--accent)]">→</span>
              </div>
            </button>
          )}

          {/* Identity card (after first rep, not surfaced yet) */}
          {hasCompletedFirstRep && hasIdentity && activeTab !== 'self' && (
            <button
              onClick={() => setActiveTab('self')}
              className="w-full text-left rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">✨</span>
                  <span className="text-sm text-[var(--text-primary)]">
                    See who you&apos;re becoming
                  </span>
                </div>
                <span className="text-sm text-[var(--accent)]">→</span>
              </div>
            </button>
          )}

          {/* Tab Navigation */}
          <div className="border-t border-b border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] -mx-4 px-4 py-3">
            <div className="flex justify-center gap-1">
              {(['system', 'journey', 'self'] as const).map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => handleTabClick(tabId)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tabId
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {tabId.charAt(0).toUpperCase() + tabId.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'system' && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5 space-y-6">
              {/* Ritual summary */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Your Ritual
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">Anchor:</span>{' '}
                    <span className="text-[var(--text-primary)]">{anchor}</span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">Action:</span>{' '}
                    <span className="text-[var(--text-primary)]">{action}</span>
                  </p>
                  {system?.then && normalizeThenSteps(system.then).length > 0 && (
                    <div className="text-[var(--text-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Then:</span>{' '}
                      {normalizeThenSteps(system.then).length === 1 ? (
                        <span className="text-[var(--text-primary)]">{normalizeThenSteps(system.then)[0]}</span>
                      ) : (
                        <ul className="mt-1 ml-4 space-y-0.5">
                          {normalizeThenSteps(system.then).map((step, i) => (
                            <li key={i} className="text-[var(--text-primary)] list-disc">{step}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <Link
                  href="/system"
                  className="inline-block text-sm text-[var(--accent)] hover:underline"
                >
                  View full system →
                </Link>
              </div>

              {/* Setup checklist (if available) */}
              {system?.setupChecklist && system.setupChecklist.length > 0 && (
                <>
                  <div className="h-px bg-[var(--bg-tertiary)]" />
                  <SetupChecklist
                    items={system.setupChecklist}
                    onToggle={handleToggleSetupItem}
                    onMarkNA={handleMarkSetupItemNA}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'journey' && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5 space-y-6">
              {/* Larger 7-day dots view */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Last 7 Days
                </p>
                <SevenDayDots repLogs={habitData.repLogs || []} />
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Your Progress
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text-primary)]">{repsCount}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Total reps</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text-primary)]">
                      {formatLastDone(lastDoneDate)}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">Last done</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'self' && (
            <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-5 space-y-6">
              {/* Identity section */}
              {system?.identity && (
                <IdentitySection
                  identity={system.identity}
                  identityBehaviors={system.identityBehaviors || []}
                />
              )}

              {/* Divider */}
              {system?.identity && (
                <div className="h-px bg-[var(--bg-tertiary)]" />
              )}

              {/* Progression section */}
              <ProgressionSection repsCount={repsCount} createdAt={createdAt} />
            </div>
          )}

          {/* Week reminder (if snapshot exists and no tab open) */}
          {snapshot && !activeTab && (
            <p className="text-center text-sm text-[var(--text-tertiary)]">
              {snapshot.line1}
            </p>
          )}

          {/* Why it works (collapsed when tab is open) */}
          {!activeTab && (
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
          )}
        </div>
      </div>
    </div>
  );
}
