import { CheckInPatterns } from './patternFinder';
import { HabitSystem, HabitType } from '@/types/habit';

/**
 * Pattern insight for display
 */
export interface PatternInsight {
  id: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: string; // Emoji or symbol
  content: string;
}

/**
 * Actionable suggestion based on patterns
 */
export interface PatternSuggestion {
  id: string;
  content: string;
  actionType: 'anchor' | 'tiny_version' | 'environment' | 'timing' | 'general';
  actionLabel: string;
}

/**
 * Complete pattern analysis result for display
 */
export interface PatternAnalysisResult {
  insights: PatternInsight[];
  suggestion: PatternSuggestion | null;
  generatedAt: string;
}

/**
 * Generate insights and suggestions from pattern data
 */
export function generatePatternAnalysis(
  patterns: CheckInPatterns,
  system: HabitSystem,
  habitType: HabitType
): PatternAnalysisResult {
  const insights: PatternInsight[] = [];
  let suggestion: PatternSuggestion | null = null;

  // === POSITIVE INSIGHTS ===

  // High response rate (>=80%, min 5 check-ins)
  if (patterns.totalCheckIns >= 5 && patterns.responseRateWhenTriggered >= 0.8) {
    insights.push({
      id: 'high_response',
      type: 'positive',
      icon: '✓',
      content: `${Math.round(patterns.responseRateWhenTriggered * 100)}% follow-through when triggered. Strong consistency.`,
    });
  }

  // Current streak (3+ in a row)
  if (patterns.currentStreak >= 3) {
    insights.push({
      id: 'streak',
      type: 'positive',
      icon: '✓',
      content: `${patterns.currentStreak} in a row. The habit is taking hold.`,
    });
  }

  // No-trigger trend for reactive habits (3+ nights)
  if (habitType === 'reactive' && patterns.currentNoTriggerStreak >= 3) {
    insights.push({
      id: 'no_trigger_streak',
      type: 'positive',
      icon: '✓',
      content: `${patterns.currentNoTriggerStreak} nights with no trigger. The habit may be improving your baseline.`,
    });
  }

  // Difficulty decreasing (need enough data)
  if (patterns.difficultyTrend === 'decreasing' && patterns.totalCheckIns >= 7) {
    insights.push({
      id: 'easier',
      type: 'positive',
      icon: '✓',
      content: 'Getting easier over time. The habit is settling in.',
    });
  }

  // Good recovery rate (if there have been misses)
  if (patterns.missedCount >= 2 && patterns.recoveryRate >= 0.5) {
    insights.push({
      id: 'good_recovery',
      type: 'positive',
      icon: '✓',
      content: `Recovered ${Math.round(patterns.recoveryRate * 100)}% of the time after misses. Good bounce-back.`,
    });
  }

  // Strong days identified
  if (patterns.strongDays.length > 0 && patterns.totalCheckIns >= 7) {
    insights.push({
      id: 'strong_days',
      type: 'positive',
      icon: '✓',
      content: `${patterns.strongDays.join(' and ')} are your best days.`,
    });
  }

  // === WARNING INSIGHTS ===

  // Weak days identified
  if (patterns.weakDays.length > 0 && patterns.totalCheckIns >= 7) {
    insights.push({
      id: 'weak_days',
      type: 'warning',
      icon: '⚠',
      content: `${patterns.weakDays.join(' and ')} tend to be harder.`,
    });

    // Generate suggestion for weak days
    if (!suggestion) {
      suggestion = {
        id: 'weak_days_suggestion',
        content: `Your ${patterns.weakDays[0]} anchor might need adjustment. Consider a different trigger for these days.`,
        actionType: 'anchor',
        actionLabel: 'Adjust anchor',
      };
    }
  }

  // Repeated miss reason
  if (patterns.repeatedMissReason && patterns.missReasonCounts[patterns.repeatedMissReason] >= 2) {
    insights.push({
      id: 'repeated_miss',
      type: 'warning',
      icon: '⚠',
      content: `"${patterns.repeatedMissReason}" has come up ${patterns.missReasonCounts[patterns.repeatedMissReason]} times.`,
    });

    // Generate suggestion for repeated miss reason
    if (!suggestion) {
      suggestion = generateSuggestionForMissReason(patterns.repeatedMissReason, system);
    }
  }

  // High difficulty persisting (average 4+ after 5+ check-ins)
  if (patterns.averageDifficulty >= 4 && patterns.totalCheckIns >= 5) {
    insights.push({
      id: 'high_difficulty',
      type: 'warning',
      icon: '⚠',
      content: `Average difficulty is ${patterns.averageDifficulty.toFixed(1)}. This might not be sustainable.`,
    });

    if (!suggestion) {
      suggestion = {
        id: 'difficulty_suggestion',
        content: 'Consider dropping to your tiny version for a week. Sustainable beats ambitious.',
        actionType: 'tiny_version',
        actionLabel: 'Use tiny version',
      };
    }
  }

  // Low response rate (<=50%, min 5 check-ins)
  if (patterns.totalCheckIns >= 5 && patterns.responseRateWhenTriggered <= 0.5) {
    insights.push({
      id: 'low_response',
      type: 'warning',
      icon: '⚠',
      content: `${Math.round(patterns.responseRateWhenTriggered * 100)}% follow-through. The system may need adjustment.`,
    });

    if (!suggestion) {
      suggestion = {
        id: 'response_suggestion',
        content: 'Something is blocking you. Let\'s look at your anchor and environment setup.',
        actionType: 'environment',
        actionLabel: 'Update setup',
      };
    }
  }

  // Difficulty increasing
  if (patterns.difficultyTrend === 'increasing' && patterns.totalCheckIns >= 7) {
    insights.push({
      id: 'harder',
      type: 'warning',
      icon: '⚠',
      content: 'Getting harder over time. The habit may need adjustment.',
    });

    if (!suggestion) {
      suggestion = {
        id: 'increasing_difficulty_suggestion',
        content: 'The habit is feeling harder. This is a signal to simplify. Try your tiny version.',
        actionType: 'tiny_version',
        actionLabel: 'Simplify habit',
      };
    }
  }

  // === NEUTRAL INSIGHTS ===

  // Week 1 milestone
  if (patterns.justCompletedWeek1) {
    insights.push({
      id: 'week1_complete',
      type: 'neutral',
      icon: '→',
      content: 'Week 1 complete. The hardest part is done.',
    });
  }

  // First miss (if they haven't had one yet, and have 5+ check-ins)
  if (patterns.totalCheckIns >= 5 && patterns.missedCount === 0) {
    insights.push({
      id: 'no_misses',
      type: 'neutral',
      icon: '→',
      content: 'No misses yet. When one happens, recovery is ready.',
    });
  }

  return {
    insights: insights.slice(0, 3), // Max 3 insights
    suggestion,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate suggestion for a specific miss reason
 */
function generateSuggestionForMissReason(reason: string, system: HabitSystem): PatternSuggestion {
  const lower = reason.toLowerCase();

  if (lower.includes('tired') || lower.includes('energy')) {
    return {
      id: 'tired_suggestion',
      content: 'Tiredness keeps showing up. Consider: is the anchor fighting your energy levels?',
      actionType: 'timing',
      actionLabel: 'Adjust timing',
    };
  }

  if (lower.includes('forgot')) {
    return {
      id: 'forgot_suggestion',
      content: 'Forgetting suggests the anchor isn\'t visible enough. Add a physical cue to your environment.',
      actionType: 'environment',
      actionLabel: 'Update setup',
    };
  }

  if (lower.includes('time') || lower.includes('busy')) {
    return {
      id: 'time_suggestion',
      content: 'When time is tight, your tiny version should kick in automatically. Is it small enough?',
      actionType: 'tiny_version',
      actionLabel: 'Shrink tiny version',
    };
  }

  return {
    id: 'general_suggestion',
    content: 'This barrier keeps appearing. Let\'s address it in your weekly reflection.',
    actionType: 'general',
    actionLabel: 'Start reflection',
  };
}

/**
 * Check if patterns section should be unlocked (7+ check-ins)
 */
export function isPatternsUnlocked(patterns: CheckInPatterns | null): boolean {
  return patterns !== null && patterns.totalCheckIns >= 7;
}

/**
 * Get progress toward unlocking patterns
 */
export function getPatternsProgress(checkInCount: number): { current: number; required: number; percentage: number } {
  const required = 7;
  const current = Math.min(checkInCount, required);
  return {
    current,
    required,
    percentage: Math.round((current / required) * 100),
  };
}
