"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import IdentitySection from "@/components/self/IdentitySection";
import ProgressionSection from "@/components/self/ProgressionSection";
import SetupChecklist from "@/components/system/SetupChecklist";
import MonthCalendar from "@/components/journey/MonthCalendar";
import DayTimeline from "@/components/journey/DayTimeline";
import PatternsSection from "@/components/journey/PatternsSection";
import NarrativeHeader from "@/components/journey/NarrativeHeader";
import DayDetailSheet from "@/components/journey/DayDetailSheet";
import { HabitData, getPlanScreenState, getHabitEmoji, getSetupProgress, normalizeThenSteps, CheckIn } from "@/types/habit";
import { toggleSetupItem, markSetupItemNA } from "@/lib/store/habitStore";
import { analyzePatterns } from "@/lib/patterns/patternFinder";

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

/**
 * Calculate which day of the week we're on (1-7) based on habit start
 */
function getWeekDay(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Day 1-7 within each week
  return (diffDays % 7) + 1;
}

/**
 * Calculate which week we're in
 */
function getWeekNumber(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

/**
 * Get progress dots state for week view
 */
function getProgressDotState(
  dayIndex: number,
  currentDay: number,
  repsCount: number
): 'completed' | 'missed' | 'future' | 'today' {
  if (dayIndex + 1 > currentDay) return 'future';
  if (dayIndex + 1 === currentDay) return 'today';
  // Simplified: assume reps done on earlier days if repsCount >= dayIndex
  // This is a rough approximation; in production, check actual logs
  if (repsCount > dayIndex) return 'completed';
  return 'missed';
}

export default function PlanScreen({ habitData: initialHabitData }: PlanScreenProps) {
  const [habitData, setHabitData] = useState(initialHabitData);
  const [activeTab, setActiveTab] = useState<TabId>(null);
  const [selectedJourneyDate, setSelectedJourneyDate] = useState<string | null>(null);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);
  const [dayDetailCheckIn, setDayDetailCheckIn] = useState<CheckIn | null>(null);

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
  // Clean anchor: remove "after", "when", time qualifiers, and normalize pronouns
  let cleanAnchor = anchor
    .replace(/^(after|when)\s+/i, '')
    .replace(/^(tonight|today|tomorrow|this evening|this morning)\s+/i, '')
    .replace(/^(after|when)\s+/i, '') // Remove again in case time qualifier was first
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();

  // Detect if anchor is a noun phrase (alarm, notification, event) vs action phrase
  const isNounPhrase = /^(\d|my\s|the\s)|alarm|notification|reminder|timer|bell/i.test(cleanAnchor) &&
    !/^(I|my)\s+(get|sit|wake|stand|finish|start|leave|arrive|come|go)/i.test(cleanAnchor);

  if (isNounPhrase) {
    if (!/^(my|the)\s/i.test(cleanAnchor)) {
      cleanAnchor = `my ${cleanAnchor}`;
    }
    if (/alarm|notification|reminder|timer|bell/i.test(cleanAnchor) && !/\b(goes|rings|sounds|fires)\b/i.test(cleanAnchor)) {
      cleanAnchor = `${cleanAnchor} goes off`;
    }
  } else {
    // For action phrases, ensure it starts with "I"
    cleanAnchor = cleanAnchor.replace(/^I\s+/i, ''); // Remove leading "I" first
    cleanAnchor = `I ${cleanAnchor.charAt(0).toLowerCase()}${cleanAnchor.slice(1)}`;
  }

  let cleanAction = action
    .replace(/^I\s+/i, '') // Remove leading "I " since we add it in template
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);
  const heroStatement = `When ${cleanAnchor}, I ${cleanAction}.`;

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

  // Open day detail sheet for a given date
  const openDayDetail = (date: string) => {
    setSelectedJourneyDate(date);
    // Look up check-in for that date
    const checkIns = habitData.checkIns || [];
    const checkIn = checkIns
      .filter(c => c.date === date)
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))[0] || null;
    setDayDetailDate(date);
    setDayDetailCheckIn(checkIn);
  };

  const closeDayDetail = () => {
    setDayDetailDate(null);
    setDayDetailCheckIn(null);
  };

  // Check if setup checklist is incomplete
  const setupProgress = getSetupProgress(system?.setupChecklist);
  const hasIncompleteSetup = setupProgress.total > 0 && setupProgress.completed < setupProgress.total;
  const isPreFirstRep = planState === 'pre_first_rep';

  // Check if identity is available
  const hasIdentity = !!system?.identity;

  // Determine habit type for CTA customization
  const habitType = system?.habitType || 'time_anchored';
  const isReactiveHabit = habitType === 'reactive';

  // CTA text based on habit type
  const primaryCTAText = isReactiveHabit ? 'How was last night?' : "Mark today's rep";

  // Calculate week progress
  const weekDay = getWeekDay(createdAt);
  const weekNumber = getWeekNumber(createdAt);

  return (
    <div className="today-screen">
      {/* Header */}
      <header className="today-header">
        <span className="today-label">YOUR HABIT</span>
        <button className="menu-button" aria-label="Menu">
          ⋯
        </button>
      </header>

      {/* Primary: Habit Card */}
      <section className="habit-card">
        <div className="habit-emoji">{emoji}</div>

        <blockquote className="ritual-statement">
          &ldquo;{heroStatement}&rdquo;
        </blockquote>

        {/* Week Progress - Clean dots without confusing labels */}
        <div className="week-progress">
          <span className="week-label">Week {weekNumber} Progress</span>
          <div className="progress-dots">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const state = getProgressDotState(day, weekDay, repsCount);
              return (
                <div
                  key={day}
                  className={`progress-dot ${state}`}
                  title={`Day ${day + 1}`}
                />
              );
            })}
          </div>
          <span className="day-label">Day {weekDay} of 7</span>
        </div>
      </section>

      {/* Primary CTA - Dominant */}
      <section className="primary-action">
        <Link href="/today" className="block w-full">
          <Button size="lg" variant="primary" className="btn-large">
            {primaryCTAText}
          </Button>
        </Link>

        {/* Secondary actions - subtle (different for reactive habits) */}
        <div className="secondary-actions">
          {isReactiveHabit ? (
            <>
              <Link href="/today?early=true" className="btn-text-small">
                Log a past night
              </Link>
              <Link href="/today?skip=true" className="btn-text-small">
                Skip today
              </Link>
            </>
          ) : (
            <>
              <Link href="/today?early=true" className="btn-text-small">
                I did it earlier
              </Link>
              <Link href="/today?miss=true" className="btn-text-small">
                I can&apos;t today
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats - Smaller, below CTA */}
      <div className="stats-row">
        <div className="stat">
          <p className="stat-value">{repsCount}</p>
          <p className="stat-label">{repsCount === 1 ? 'Rep' : 'Reps'}</p>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <p className="stat-value">{formatLastDone(lastDoneDate)}</p>
          <p className="stat-label">Last done</p>
        </div>
      </div>

      {/* Conditional Cards */}

      {/* Tune-Up Available Card */}
      {planState === 'tune_up_available' && (
        <Link href="/tuneup" className="block">
          <div className="nudge-card accent">
            <span className="nudge-emoji">🎉</span>
            <div className="nudge-content">
              <p className="nudge-title">You did your first rep!</p>
              <p className="nudge-text">Let&apos;s set up your system so it keeps going.</p>
            </div>
            <span className="nudge-arrow">→</span>
          </div>
        </Link>
      )}

      {/* Setup nudge - Lower priority */}
      {hasIncompleteSetup && setupProgress.total > 0 && activeTab !== 'system' && (
        <button
          onClick={() => setActiveTab('system')}
          className="nudge-card"
        >
          <span className="nudge-emoji">⚙️</span>
          <span className="nudge-text-inline">
            Finish setup ({setupProgress.completed}/{setupProgress.total})
          </span>
          <span className="nudge-arrow">→</span>
        </button>
      )}

      {/* Tab Content - Inline expansion */}
      {activeTab === 'system' && (
        <div className="tab-content">
          {/* Ritual summary */}
          <div className="content-section">
            <p className="section-label">Your Ritual</p>
            <div className="ritual-details">
              <p><span className="detail-label">Anchor:</span> {anchor}</p>
              <p><span className="detail-label">Action:</span> {action}</p>
              {system?.then && normalizeThenSteps(system.then).length > 0 && (
                <div>
                  <span className="detail-label">Then:</span>{' '}
                  {normalizeThenSteps(system.then).length === 1 ? (
                    <span>{normalizeThenSteps(system.then)[0]}</span>
                  ) : (
                    <ul className="then-list">
                      {normalizeThenSteps(system.then).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Link href="/system" className="section-link">
              View full system →
            </Link>
          </div>

          {/* Setup checklist */}
          {system?.setupChecklist && system.setupChecklist.length > 0 && (
            <>
              <div className="divider" />
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
        <div className="tab-content journey-tab">
          {/* Narrative Header — Momentum ring + insight */}
          <NarrativeHeader
            checkIns={habitData.checkIns || []}
            startDate={createdAt.split('T')[0]}
          />

          <div className="divider" />

          {/* Month Calendar */}
          <MonthCalendar
            checkIns={habitData.checkIns || []}
            startDate={createdAt.split('T')[0]}
            selectedDate={selectedJourneyDate}
            onDaySelect={openDayDetail}
          />

          <div className="divider" />

          {/* Day Timeline */}
          <DayTimeline
            checkIns={habitData.checkIns || []}
            selectedDate={selectedJourneyDate}
            onDayClick={openDayDetail}
          />

          {/* Patterns Section - after 7+ check-ins */}
          {(habitData.checkIns?.length || 0) >= 7 && (
            <>
              <div className="divider" />
              <PatternsSection
                patterns={analyzePatterns(habitData.checkIns || [], system?.habitType || 'time_anchored')}
                system={system!}
                habitType={system?.habitType || 'time_anchored'}
              />
            </>
          )}

          {/* Day Detail Bottom Sheet */}
          <DayDetailSheet
            isOpen={!!dayDetailDate}
            onClose={closeDayDetail}
            checkIn={dayDetailCheckIn}
            date={dayDetailDate}
          />
        </div>
      )}

      {activeTab === 'self' && (
        <div className="tab-content">
          {/* Identity section */}
          {hasIdentity && (
            <IdentitySection
              identity={system!.identity!}
              identityBehaviors={system!.identityBehaviors || []}
            />
          )}

          {hasIdentity && <div className="divider" />}

          {/* Progression section */}
          <ProgressionSection repsCount={repsCount} createdAt={createdAt} />
        </div>
      )}

      {/* Why this works - Collapsed */}
      {!activeTab && (
        <details className="science-section">
          <summary className="science-trigger">Why this approach works</summary>
          <div className="science-content">
            <p>
              Tiny actions attached to existing routines are nearly impossible to skip.
              If you do miss, the 30-second recovery brings you right back.
              No lost progress—just continuity.
            </p>
          </div>
        </details>
      )}

      {/* Tab Navigation - Fixed footer */}
      <nav className="tab-nav">
        {(['system', 'journey', 'self'] as const).map((tabId) => (
          <button
            key={tabId}
            onClick={() => handleTabClick(tabId)}
            className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
          >
            <span className="tab-icon">
              {tabId === 'system' && '📋'}
              {tabId === 'journey' && '📈'}
              {tabId === 'self' && '✨'}
            </span>
            <span className="tab-label">{tabId.charAt(0).toUpperCase() + tabId.slice(1)}</span>
          </button>
        ))}
      </nav>

      <style jsx>{`
        .today-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 16px;
          padding-bottom: 100px;
          background: var(--bg-primary);
        }

        .today-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .today-label {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          letter-spacing: 0.05em;
        }

        .menu-button {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px 8px;
        }

        /* Habit Card - Hero element */
        .habit-card {
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 20px;
        }

        .habit-emoji {
          font-size: 36px;
          margin-bottom: 12px;
        }

        .ritual-statement {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0 0 20px 0;
          padding: 0;
          border: none;
        }

        /* Week Progress - Cleaner design */
        .week-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .week-label {
          font-size: 11px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .progress-dots {
          display: flex;
          gap: 8px;
        }

        .progress-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-tertiary);
        }

        .progress-dot.completed {
          background: var(--accent-primary);
        }

        .progress-dot.missed {
          background: transparent;
          border: 2px solid var(--text-tertiary);
          opacity: 0.5;
        }

        .progress-dot.future {
          background: var(--bg-tertiary);
          border: 1px dashed var(--text-tertiary);
        }

        .progress-dot.today {
          background: var(--bg-tertiary);
          box-shadow: 0 0 0 2px var(--accent-primary);
        }

        .day-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        /* Primary CTA - Dominant */
        .primary-action {
          margin-bottom: 16px;
        }

        :global(.btn-large) {
          width: 100%;
          padding: 16px 24px !important;
          font-size: 16px !important;
        }

        .secondary-actions {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 12px;
        }

        .btn-text-small {
          background: none;
          border: none;
          font-size: 13px;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          text-decoration: none;
        }

        .btn-text-small:hover {
          color: var(--text-secondary);
        }

        /* Stats row */
        .stats-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-bottom: 20px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--bg-tertiary);
        }

        /* Nudge cards */
        .nudge-card {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
        }

        .nudge-card.accent {
          background: var(--accent-subtle);
          border-color: var(--accent-primary);
        }

        .nudge-emoji {
          font-size: 18px;
        }

        .nudge-content {
          flex: 1;
        }

        .nudge-title {
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 2px 0;
          font-size: 14px;
        }

        .nudge-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .nudge-text-inline {
          flex: 1;
          font-size: 13px;
          color: var(--text-primary);
        }

        .nudge-arrow {
          color: var(--accent-primary);
          font-size: 14px;
        }

        /* Tab Content */
        .tab-content {
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .content-section {
          margin-bottom: 0;
        }

        .section-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px 0;
        }

        .ritual-details {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
        }

        .ritual-details p {
          margin: 0 0 6px 0;
        }

        .detail-label {
          color: var(--text-tertiary);
        }

        .then-list {
          margin: 4px 0 0 16px;
          padding: 0;
        }

        .then-list li {
          margin-bottom: 2px;
        }

        .section-link {
          display: inline-block;
          margin-top: 12px;
          font-size: 13px;
          color: var(--accent-primary);
          text-decoration: none;
        }

        .section-link:hover {
          text-decoration: underline;
        }

        .divider {
          height: 1px;
          background: var(--bg-tertiary);
          margin: 20px 0;
        }

        .journey-stats {
          display: flex;
          gap: 32px;
        }

        .journey-stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .journey-stat-label {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0;
        }

        .journey-tab {
          max-height: 60vh;
          overflow-y: auto;
        }

        /* Science section */
        .science-section {
          margin-bottom: 16px;
        }

        .science-trigger {
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 12px 0;
        }

        .science-content {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .science-content p {
          margin: 0;
        }

        /* Tab Navigation - Fixed footer */
        .tab-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          background: var(--bg-secondary);
          border-top: 1px solid var(--bg-tertiary);
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
        }

        /* For centered mobile frame on desktop */
        @media (min-width: 768px) {
          .tab-nav {
            max-width: 480px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 0 0 24px 24px;
          }
        }

        .tab-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 16px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .tab-button:hover {
          background: var(--bg-tertiary);
        }

        .tab-button.active {
          background: var(--accent-subtle);
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .tab-button.active .tab-label {
          color: var(--accent-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
