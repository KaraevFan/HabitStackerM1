/**
 * Graduation Detector (R18)
 *
 * Assesses whether a habit is ready for graduation.
 * Criteria:
 * - 4+ weeks active
 * - 80%+ completion in last 2 weeks
 * - Avg difficulty ≤ 2 in last week
 *
 * Never automatic — surfaces as AI suggestion during weekly reflection or stage transition
 */

import { HabitData, CheckIn } from '@/types/habit';

export interface GraduationCriterion {
  label: string;
  met: boolean;
  detail: string;
}

export interface GraduationAssessment {
  ready: boolean;
  criteria: GraduationCriterion[];
  summary: string;
}

/**
 * Assess whether habit is ready for graduation
 */
export function assessGraduation(
  habitData: HabitData,
  checkIns: CheckIn[]
): GraduationAssessment {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(habitData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Criterion 1: 4+ weeks active (28+ days)
  const weeksActive = Math.floor(daysSinceCreation / 7);
  const durationMet = weeksActive >= 4;

  // Criterion 2: 80%+ completion in last 2 weeks
  const last14Days = getLast14DaysCheckIns(checkIns);
  const triggered = last14Days.filter(c => c.triggerOccurred);
  const completed = triggered.filter(c => c.actionTaken || c.recoveryCompleted);
  const completionRate = triggered.length > 0 ? completed.length / triggered.length : 0;
  const completionMet = completionRate >= 0.8;

  // Criterion 3: Avg difficulty ≤ 2 in last week
  const last7Days = getLast7DaysCheckIns(checkIns);
  const withDifficulty = last7Days.filter(c => c.difficultyRating != null);
  const avgDifficulty = withDifficulty.length > 0
    ? withDifficulty.reduce((sum, c) => sum + (c.difficultyRating || 3), 0) / withDifficulty.length
    : 3;
  const difficultyMet = avgDifficulty <= 2;

  const criteria: GraduationCriterion[] = [
    {
      label: '4+ weeks active',
      met: durationMet,
      detail: `${weeksActive} weeks`,
    },
    {
      label: '80%+ completion (last 2 weeks)',
      met: completionMet,
      detail: `${Math.round(completionRate * 100)}%`,
    },
    {
      label: 'Avg difficulty ≤ 2 (last week)',
      met: difficultyMet,
      detail: `${avgDifficulty.toFixed(1)}/5`,
    },
  ];

  const ready = durationMet && completionMet && difficultyMet;

  let summary: string;
  if (ready) {
    summary = 'This habit has become automatic. You might be ready to graduate and start something new.';
  } else {
    const unmet = criteria.filter(c => !c.met).map(c => c.label);
    summary = `Not quite ready yet. Still working on: ${unmet.join(', ')}.`;
  }

  return { ready, criteria, summary };
}

function getLast14DaysCheckIns(checkIns: CheckIn[]): CheckIn[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return checkIns.filter(c => c.date >= cutoffStr);
}

function getLast7DaysCheckIns(checkIns: CheckIn[]): CheckIn[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return checkIns.filter(c => c.date >= cutoffStr);
}
