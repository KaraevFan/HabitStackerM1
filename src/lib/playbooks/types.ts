/**
 * Domain Playbooks — Curated scaffolds for expert-like guidance
 *
 * Each playbook provides structured content for a specific sub-problem,
 * ensuring the system feels authoritative and domain-aware.
 */

import type { HabitDomain } from "@/types/habit";

/**
 * Questionnaire answer options (Iteration 4: reduced to 3 questions)
 */
export type TimingPreference = "morning" | "midday" | "evening" | "flexible";
export type PrimaryBarrier = "time" | "energy" | "motivation" | "forgetting";
export type ExperienceLevel = "first_time" | "tried_before" | "tried_many_times";

// Deprecated: removed in Iteration 4
export type EnergyLevel = "high" | "medium" | "low";
export type Environment = "home" | "office" | "commute" | "varies";

/**
 * User's questionnaire answers (Iteration 4: 3 questions only)
 * Note: Fields are optional to allow partial answers during flow
 */
export interface QuestionnaireAnswers {
  timing?: TimingPreference;
  barrier?: PrimaryBarrier;
  experience?: ExperienceLevel;
  // Deprecated fields (kept for backwards compatibility)
  energy?: EnergyLevel;
  environment?: Environment;
}

/**
 * Complete questionnaire answers (all required fields filled)
 */
export interface CompleteQuestionnaireAnswers {
  timing: TimingPreference;
  barrier: PrimaryBarrier;
  experience: ExperienceLevel;
}

/**
 * Progression ladder showing observable behaviors over time
 */
export interface ProgressionLadder {
  week1: string;   // What success looks like in Week 1
  month1: string;  // What success looks like at 1 month
  month3: string;  // What success looks like at 3 months
}

/**
 * A candidate Week-1 habit with fit criteria
 */
export interface CandidateHabit {
  id: string;
  action: string;           // The specific behavior (≤2 min)
  whyWeek1: string;         // Why this is a good Week-1 wedge
  // Fit criteria for personalization
  bestTiming: TimingPreference[];    // Which timing preferences this fits
  bestEnergy: EnergyLevel[];         // Which energy levels this works for
  addressesBarrier: PrimaryBarrier[]; // Which barriers this helps with
  // Suggested system components
  suggestedAnchor: string;
  suggestedRecovery: string;
}

/**
 * Complete playbook for a sub-problem
 */
export interface DomainPlaybook {
  domainId: HabitDomain;
  subProblemId: string;

  // Portrait of Excellence — what successful people do (3-4 bullets)
  portrait: string[];

  // Progression Ladder — observable behaviors over time
  progression: ProgressionLadder;

  // Common Traps — failure modes to avoid (2-3 items)
  traps: string[];

  // Leverage Points — highest-impact starting moves (1-2 items)
  leveragePoints: string[];

  // Small → Big explanation
  smallToBig: string;

  // Candidate Week-1 habits (2-4 options)
  candidateHabits: CandidateHabit[];
}

/**
 * Question definition for the micro-questionnaire
 */
export interface QuestionDefinition {
  id: keyof QuestionnaireAnswers;
  question: string;
  options: {
    value: string;
    label: string;
    description?: string;
  }[];
}

/**
 * Inference summary based on questionnaire answers
 */
export interface InferenceSummary {
  summary: string;        // 1-2 line reflection
  timingInsight: string;  // Specific insight about timing
  barrierInsight: string; // Specific insight about main barrier
}
