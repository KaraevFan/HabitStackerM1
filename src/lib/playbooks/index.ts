/**
 * Domain Playbooks — Main exports and utilities
 */

import type { HabitDomain } from "@/types/habit";
import type {
  DomainPlaybook,
  QuestionnaireAnswers,
  CompleteQuestionnaireAnswers,
  QuestionDefinition,
  InferenceSummary,
  CandidateHabit,
} from "./types";

// Import domain-specific playbooks
import { healthPlaybooks } from "./health";
import { financesPlaybooks } from "./finances";
import { homePlaybooks } from "./home";
import { relationshipsPlaybooks } from "./relationships";
import { learningPlaybooks } from "./learning";

// Re-export types
export * from "./types";

/**
 * All playbooks indexed by domain and sub-problem
 */
const ALL_PLAYBOOKS: Record<HabitDomain, Record<string, DomainPlaybook>> = {
  health: healthPlaybooks,
  finances: financesPlaybooks,
  home: homePlaybooks,
  relationships: relationshipsPlaybooks,
  learning: learningPlaybooks,
};

/**
 * Get playbook for a specific domain and sub-problem
 */
export function getPlaybook(
  domainId: HabitDomain,
  subProblemId: string
): DomainPlaybook | undefined {
  return ALL_PLAYBOOKS[domainId]?.[subProblemId];
}

/**
 * Micro-questionnaire questions (Iteration 4: reduced to 3)
 * Removed: energy (inferable from timing), environment (not always relevant)
 */
export const QUESTIONNAIRE: QuestionDefinition[] = [
  {
    id: "timing",
    question: "When could you realistically do this?",
    options: [
      { value: "morning", label: "Morning", description: "Before noon" },
      { value: "midday", label: "Midday", description: "Lunch or afternoon" },
      { value: "evening", label: "Evening", description: "After work" },
      { value: "flexible", label: "Flexible", description: "Varies by day" },
    ],
  },
  {
    id: "barrier",
    question: "What usually gets in the way?",
    options: [
      { value: "time", label: "Not enough time", description: "Too busy" },
      { value: "energy", label: "Too tired", description: "Low energy" },
      { value: "motivation", label: "Hard to start", description: "Procrastination" },
      { value: "forgetting", label: "I forget", description: "Slips my mind" },
    ],
  },
  {
    id: "experience",
    question: "Have you tried building this habit before?",
    options: [
      { value: "first_time", label: "First time", description: "New territory" },
      { value: "tried_before", label: "Tried once or twice", description: "Some experience" },
      { value: "tried_many_times", label: "Tried many times", description: "Keep restarting" },
    ],
  },
];

/**
 * Generate inference summary from questionnaire answers
 * Iteration 4: Pattern-based insight, not just receipt of selections
 */
export function generateInferenceSummary(
  answers: CompleteQuestionnaireAnswers,
  subProblemLabel: string
): InferenceSummary {
  const timingLabels: Record<string, string> = {
    morning: "mornings",
    midday: "midday",
    evening: "evenings",
    flexible: "flexible timing",
  };

  const barrierLabels: Record<string, string> = {
    time: "finding time",
    energy: "low energy",
    motivation: "getting started",
    forgetting: "remembering to do it",
  };

  // Generate pattern-based insight (not just receipt)
  let insight: string;
  let summary: string;

  if (answers.experience === "tried_many_times") {
    if (answers.barrier === "forgetting") {
      insight = "The fact that you keep coming back means the desire is real. The issue isn't motivation—it's the system. You need a trigger that makes forgetting impossible.";
      summary = `You've tried this many times, and it keeps slipping off your radar.`;
    } else if (answers.barrier === "energy") {
      insight = "You want this, but life keeps getting in the way. The solution isn't more willpower—it's a smaller action that works even on your worst days.";
      summary = `You've tried this many times, but energy is always the barrier.`;
    } else if (answers.barrier === "motivation") {
      insight = "Starting is the hardest part—you know that. The trick is making the first step so small that motivation becomes irrelevant.";
      summary = `You've tried this many times, but getting started is always the struggle.`;
    } else {
      insight = "You've been at this before. This time, we're designing a system that survives your busy days, not one that requires perfect conditions.";
      summary = `You've tried this many times, but time is always scarce.`;
    }
  } else if (answers.experience === "first_time") {
    insight = "Starting fresh is actually an advantage—no bad habits to unlearn. We'll build something small that sticks from day one.";
    summary = `This is new territory. ${timingLabels[answers.timing].charAt(0).toUpperCase() + timingLabels[answers.timing].slice(1)} work for you, and ${barrierLabels[answers.barrier]} is the main thing to design around.`;
  } else {
    // tried_before
    if (answers.barrier === "forgetting") {
      insight = "You've done this before, so you know you can. The gap isn't ability—it's having a reliable trigger. Let's fix that.";
    } else if (answers.barrier === "energy") {
      insight = "You've done this before, so you know you can. The key is making the action small enough that energy doesn't matter.";
    } else {
      insight = "You've done this before, so you know you can. This time, we'll build in a system that handles the hard days.";
    }
    summary = `You've tried this before. ${timingLabels[answers.timing].charAt(0).toUpperCase() + timingLabels[answers.timing].slice(1)} work, but ${barrierLabels[answers.barrier]} gets in the way.`;
  }

  return {
    summary,
    timingInsight: `${timingLabels[answers.timing].charAt(0).toUpperCase() + timingLabels[answers.timing].slice(1)} works best`,
    barrierInsight: insight,
  };
}

/**
 * Score a candidate habit based on questionnaire answers
 * Iteration 4: Updated for 3-question format (no energy/environment)
 * Returns a score 0-100 and fit reasons
 */
export function scoreHabitFit(
  habit: CandidateHabit,
  answers: CompleteQuestionnaireAnswers
): { score: number; fitReasons: string[] } {
  let score = 50; // Base score
  const fitReasons: string[] = [];

  // Timing fit (now weighted higher since we have fewer signals)
  if (habit.bestTiming.includes(answers.timing)) {
    score += 20;
    const timingLabel = answers.timing === "morning" ? "morning" :
                        answers.timing === "evening" ? "evening" :
                        answers.timing === "midday" ? "midday" : "flexible schedule";
    fitReasons.push(`Works well in the ${timingLabel}`);
  }

  // Barrier fit (primary signal now)
  if (habit.addressesBarrier.includes(answers.barrier)) {
    score += 25;
    const barrierDescriptions: Record<string, string> = {
      time: "Quick enough to fit in busy days",
      energy: "Simple enough for low-energy moments",
      motivation: "Easy to start—no willpower needed",
      forgetting: "Has a clear trigger so you won't forget",
    };
    fitReasons.push(barrierDescriptions[answers.barrier]);
  }

  // Experience adjustment
  if (answers.experience === "tried_many_times") {
    // Favor ultra-simple habits for people who keep restarting
    if (habit.action.includes("one") || habit.action.includes("1") || habit.action.includes("5 ")) {
      score += 15;
      fitReasons.push("Ultra-simple—designed to rebuild momentum");
    }
  } else if (answers.experience === "first_time") {
    // First-timers get a clean slate message
    if (fitReasons.length > 0) {
      fitReasons.push("Great starting point for beginners");
    }
  }

  return { score, fitReasons };
}

/**
 * Rank habits for a user based on questionnaire answers
 */
export function rankHabitsForUser(
  playbook: DomainPlaybook,
  answers: CompleteQuestionnaireAnswers
): Array<CandidateHabit & { score: number; fitReasons: string[] }> {
  const scored = playbook.candidateHabits.map((habit) => ({
    ...habit,
    ...scoreHabitFit(habit, answers),
  }));

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}
