/**
 * Inline Whispers - Education Layer 1
 *
 * Micro-doses of insight that build trust and understanding.
 * Shown after check-ins based on context and history.
 */

import { CheckIn, HabitSystem, getCheckInState } from '@/types/habit';

export interface Whisper {
  content: string;
  type: 'encouragement' | 'insight' | 'tip';
}

/**
 * Miss reasons that can trigger specific tips
 */
export const MISS_REASONS = {
  TIME: "Didn't have time",
  FORGOT: 'Forgot in the moment',
  NOT_FEELING: "Wasn't feeling up to it",
  SOMETHING_ELSE: 'Something else came up',
  TOO_TIRED: 'Too tired to get up',
  TOO_COLD: 'The other room was too cold',
  FIVE_MORE_MINUTES: 'Told myself "just 5 more minutes"',
} as const;

/**
 * Get contextual whisper for a check-in
 *
 * Logic:
 * - First rep: Encouragement about retraining associations
 * - First miss: Normalize + recovery focus
 * - Multiple "no trigger": Could mean habit is working
 * - Same miss reason 2x: Specific friction tip
 * - After recovery: Still in the game
 */
export function getWhisperForCheckIn(
  checkIn: CheckIn,
  allCheckIns: CheckIn[],
  habitSystem: HabitSystem
): Whisper | null {
  const state = getCheckInState(checkIn);
  const isReactiveHabit = habitSystem.habitType === 'reactive';

  // Count previous check-ins
  const previousCheckIns = allCheckIns.filter(c => c.id !== checkIn.id);
  const completedCount = previousCheckIns.filter(c => getCheckInState(c) === 'completed').length;
  const missedCount = previousCheckIns.filter(c => getCheckInState(c) === 'missed').length;
  const noTriggerCount = previousCheckIns.filter(c => getCheckInState(c) === 'no_trigger').length;

  // First rep logged
  if (state === 'completed' && completedCount === 0) {
    return getFirstRepWhisper(isReactiveHabit);
  }

  // First miss
  if (state === 'missed' && missedCount === 0) {
    return getFirstMissWhisper();
  }

  // Recovery completed
  if (state === 'recovered') {
    return getRecoveryWhisper();
  }

  // For reactive habits: multiple "no trigger" nights
  if (state === 'no_trigger' && isReactiveHabit) {
    if (noTriggerCount >= 3) {
      return getNoTriggerPatternWhisper();
    }
    return getNoTriggerWhisper(noTriggerCount);
  }

  // Check for repeated miss reason
  if (state === 'missed' && checkIn.missReason) {
    const sameReasonCount = previousCheckIns.filter(
      c => c.missReason === checkIn.missReason
    ).length;

    if (sameReasonCount >= 1) {
      return getMissReasonTip(checkIn.missReason);
    }
  }

  // Streak of completions
  if (state === 'completed') {
    const consecutiveCompleted = getConsecutiveCompletedCount(allCheckIns);
    if (consecutiveCompleted >= 3 && consecutiveCompleted % 3 === 0) {
      return getStreakWhisper(consecutiveCompleted);
    }
  }

  return null;
}

/**
 * First rep completed whisper
 */
function getFirstRepWhisper(isReactive: boolean): Whisper {
  if (isReactive) {
    return {
      content:
        "You're retraining your brain's association. Getting up when you wake is the signal that breaks the old pattern.",
      type: 'insight',
    };
  }

  return {
    content:
      "First rep logged! You're building an association, not just doing an action. Each rep strengthens the connection.",
    type: 'encouragement',
  };
}

/**
 * First miss whisper
 */
function getFirstMissWhisper(): Whisper {
  return {
    content:
      "Missing happens. What matters is what you do next. The recovery action keeps the pattern alive.",
    type: 'encouragement',
  };
}

/**
 * Recovery completed whisper
 */
function getRecoveryWhisper(): Whisper {
  return {
    content:
      "You did the recovery. That's not a consolation prize — it's you signaling to your brain that you're still committed.",
    type: 'encouragement',
  };
}

/**
 * No trigger (for reactive habits) whisper
 */
function getNoTriggerWhisper(previousNoTriggerCount: number): Whisper {
  if (previousNoTriggerCount === 0) {
    return {
      content:
        "No trigger means no rep needed — but this is still valuable data. I'm tracking your restful nights.",
      type: 'insight',
    };
  }

  return {
    content:
      "Another restful night logged. These matter as much as the protocol nights.",
    type: 'encouragement',
  };
}

/**
 * Pattern of no-trigger nights (could mean habit is working)
 */
function getNoTriggerPatternWhisper(): Whisper {
  return {
    content:
      "Multiple restful nights this week. This could mean the habit is working — when your brain learns that bed means sleep, the waking episodes often decrease.",
    type: 'insight',
  };
}

/**
 * Streak of completions whisper
 */
function getStreakWhisper(count: number): Whisper {
  if (count >= 7) {
    return {
      content:
        "A full week of showing up. The habit is starting to run itself. Now you protect it.",
      type: 'encouragement',
    };
  }

  return {
    content: `${count} in a row. Showing up is the work.`,
    type: 'encouragement',
  };
}

/**
 * Get specific tip for repeated miss reason
 */
function getMissReasonTip(missReason: string): Whisper | null {
  const tips: Record<string, Whisper> = {
    [MISS_REASONS.TOO_TIRED]: {
      content:
        '"Too tired" is the hardest barrier. Your willpower is depleted. Make the path easier: slippers by the bed, robe within reach.',
      type: 'tip',
    },
    [MISS_REASONS.TOO_COLD]: {
      content:
        "Cold is real friction. A warm robe right by the bed, or a small heater on timer in the other room, removes this barrier.",
      type: 'tip',
    },
    [MISS_REASONS.FIVE_MORE_MINUTES]: {
      content:
        '"Just 5 more minutes" is how good intentions die. Try making the first action automatic — feet on floor before you can negotiate.',
      type: 'tip',
    },
    [MISS_REASONS.FORGOT]: {
      content:
        "Forgetting in the moment means the trigger isn't strong enough. Can you add a visual cue? Something that catches your attention right when the anchor happens?",
      type: 'tip',
    },
    [MISS_REASONS.NOT_FEELING]: {
      content:
        "Not feeling up to it is valid. That's exactly when the tiny version matters most. What's the 30-second version that still counts?",
      type: 'tip',
    },
    [MISS_REASONS.TIME]: {
      content:
        "Time pressure is a common barrier. Is there a way to make the action even smaller? 2 minutes is the max — but 30 seconds is fine too.",
      type: 'tip',
    },
  };

  return tips[missReason] || null;
}

/**
 * Count consecutive completed check-ins (ending with most recent)
 */
function getConsecutiveCompletedCount(checkIns: CheckIn[]): number {
  // Sort by date descending
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));

  let count = 0;
  for (const checkIn of sorted) {
    const state = getCheckInState(checkIn);
    if (state === 'completed' || state === 'recovered') {
      count++;
    } else if (state === 'missed') {
      break;
    }
    // 'no_trigger' doesn't break the streak for reactive habits
  }

  return count;
}

/**
 * Get encouraging title for check-in success screen
 */
export function getSuccessTitle(
  checkInState: 'completed' | 'no_trigger' | 'recovered',
  completedCount: number
): string {
  if (checkInState === 'no_trigger') {
    return 'Good night logged.';
  }

  if (checkInState === 'recovered') {
    return 'Recovery logged.';
  }

  if (completedCount === 0) {
    return 'First rep logged!';
  }

  if (completedCount >= 6) {
    return 'Rep logged.';
  }

  return 'Rep logged.';
}

/**
 * Get subtitle/tagline for success screen
 */
export function getSuccessSubtitle(
  checkInState: 'completed' | 'no_trigger' | 'recovered',
  completedCount: number
): string {
  if (checkInState === 'no_trigger') {
    return 'No trigger, no rep needed — but this is still valuable data.';
  }

  if (checkInState === 'recovered') {
    return "You're still in the game.";
  }

  if (completedCount === 0) {
    return "You've started building the association.";
  }

  if (completedCount === 1) {
    return "That's two. The pattern is forming.";
  }

  if (completedCount >= 6) {
    return 'Showing up is the work.';
  }

  return `That's ${completedCount + 1} reps. Keep showing up.`;
}
