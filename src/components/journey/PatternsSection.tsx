'use client';

import { CheckInPatterns } from '@/lib/patterns/patternFinder';
import {
  generatePatternAnalysis,
  isPatternsUnlocked,
  getPatternsProgress,
} from '@/lib/patterns/insightGenerator';
import { HabitSystem, HabitType } from '@/types/habit';

interface PatternsSectionProps {
  patterns: CheckInPatterns | null;
  system: HabitSystem;
  habitType: HabitType;
  onAction?: (actionType: string) => void;
  onDismiss?: () => void;
}

/**
 * PatternsSection - Displays pattern insights and actionable suggestions
 * Locked until 7 check-ins
 */
export default function PatternsSection({
  patterns,
  system,
  habitType,
  onAction,
  onDismiss,
}: PatternsSectionProps) {
  // Show locked state if not enough check-ins
  if (!isPatternsUnlocked(patterns)) {
    const progress = getPatternsProgress(patterns?.totalCheckIns || 0);

    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
          Patterns
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Insights will appear after 7 check-ins.
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < progress.current
                  ? 'bg-[var(--accent-primary)]'
                  : 'bg-[var(--bg-tertiary)]'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-[var(--text-tertiary)] text-center">
          {progress.current} of {progress.required}
        </p>
      </div>
    );
  }

  // Generate analysis
  const analysis = generatePatternAnalysis(patterns!, system, habitType);

  // If no insights, show a neutral message
  if (analysis.insights.length === 0 && !analysis.suggestion) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
          What I'm Noticing
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          No strong patterns yet. Keep logging — insights will emerge.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-4">
          Based on {patterns!.totalCheckIns} check-ins
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-1">
        What I'm Noticing
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">
        Based on your last {patterns!.totalCheckIns} check-ins
      </p>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="space-y-3 mb-4">
          {analysis.insights.map((insight) => (
            <div
              key={insight.id}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                insight.type === 'positive'
                  ? 'bg-[var(--success-bg)]'
                  : insight.type === 'warning'
                  ? 'bg-[var(--warning-bg)]'
                  : 'bg-[var(--bg-primary)]'
              }`}
            >
              <span
                className={`text-lg ${
                  insight.type === 'positive'
                    ? 'text-[var(--success-text)]'
                    : insight.type === 'warning'
                    ? 'text-[var(--warning-text)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {insight.icon}
              </span>
              <span
                className={`text-sm ${
                  insight.type === 'positive'
                    ? 'text-[var(--success-text)]'
                    : insight.type === 'warning'
                    ? 'text-[var(--warning-text)]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {insight.content}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actionable suggestion */}
      {analysis.suggestion && (
        <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-[var(--accent-primary)]">→</span>
            <p className="text-sm text-[var(--text-primary)]">
              {analysis.suggestion.content}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            {onAction && (
              <button
                onClick={() => onAction(analysis.suggestion!.actionType)}
                className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {analysis.suggestion.actionLabel}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated timestamp */}
      <p className="text-xs text-[var(--text-tertiary)] mt-4 text-right">
        Updates weekly
      </p>
    </div>
  );
}
