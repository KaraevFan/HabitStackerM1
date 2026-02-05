"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveConsultSelection, loadHabitData } from "@/lib/store/habitStore";
import { getSubProblemById, QuestionnaireAnswers } from "@/types/habit";
import {
  getPlaybook,
  rankHabitsForUser,
  type CandidateHabit,
  type CompleteQuestionnaireAnswers,
} from "@/lib/playbooks";

interface HabitRecommendationStepProps {
  onComplete: () => void;
}

interface RankedHabit extends CandidateHabit {
  score: number;
  fitReasons: string[];
}

export default function HabitRecommendationStep({ onComplete }: HabitRecommendationStepProps) {
  const [rankedHabits, setRankedHabits] = useState<RankedHabit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subProblemLabel, setSubProblemLabel] = useState<string>("");
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    const domainId = data.consultSelections.domain;
    const subProblemId = data.consultSelections.subProblem;
    const questionnaireAnswers = data.consultSelections.questionnaire;

    console.log("[HabitRecommendationStep] Loading habits for:", domainId, subProblemId);
    console.log("[HabitRecommendationStep] Questionnaire answers:", questionnaireAnswers);

    if (domainId && subProblemId) {
      const subProblem = getSubProblemById(domainId, subProblemId);
      if (subProblem) {
        setSubProblemLabel(subProblem.label);
      }
    }

    if (domainId && subProblemId) {
      const playbook = getPlaybook(domainId, subProblemId);
      console.log("[HabitRecommendationStep] Playbook found:", playbook?.subProblemId, "with", playbook?.candidateHabits.length, "habits");
      if (playbook && playbook.candidateHabits.length > 0) {
        if (questionnaireAnswers && isCompleteAnswers(questionnaireAnswers)) {
          setHasQuestionnaire(true);
          const completeAnswers: CompleteQuestionnaireAnswers = {
            timing: questionnaireAnswers.timing!,
            barrier: questionnaireAnswers.barrier!,
            experience: questionnaireAnswers.experience!,
          };
          const ranked = rankHabitsForUser(playbook, completeAnswers);
          setRankedHabits(ranked.slice(0, 3));
        } else {
          setHasQuestionnaire(false);
          const withScores = playbook.candidateHabits.map((h) => ({
            ...h,
            score: 50,
            fitReasons: [],
          }));
          setRankedHabits(withScores.slice(0, 3));
        }
      }
    }

    setIsLoading(false);
  }, []);

  const handleSelectOption = (optionId: string) => {
    setSelectedId(optionId);
  };

  const handleSubmit = () => {
    if (!selectedId) return;

    const selectedHabit = rankedHabits.find((h) => h.id === selectedId);
    if (selectedHabit) {
      saveConsultSelection("selectedHabitId", selectedId);
      saveConsultSelection("selectedHabit", selectedHabit.action);
      saveConsultSelection("intent", selectedHabit.action);
      saveConsultSelection("anchor", selectedHabit.suggestedAnchor);
      saveConsultSelection("recovery", selectedHabit.suggestedRecovery);
    }

    onComplete();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Finding your Week-1 habit
          </h1>
          <p className="text-[var(--text-secondary)]">
            Matching habits to your preferences...
          </p>
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)]" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (rankedHabits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Something went wrong
          </h1>
          <p className="text-[var(--text-secondary)]">
            We couldn&apos;t find habits for this selection. Please go back and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Your Week-1 habit
        </h1>
        <p className="text-[var(--text-secondary)]">
          {hasQuestionnaire
            ? "Based on your answers, here are the habits that fit you best."
            : `Proven starting points for "${subProblemLabel.toLowerCase()}".`}
        </p>
      </div>

      {hasQuestionnaire && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--success-subtle)] px-3 py-2 text-sm text-[var(--success)]">
          <span>✓</span>
          <span>Personalized based on your timing, energy, and barriers</span>
        </div>
      )}

      <div className="space-y-4">
        {rankedHabits.map((habit, index) => {
          const isRecommended = index === 0;
          const isSelected = selectedId === habit.id;

          return (
            <Card
              key={habit.id}
              selected={isSelected}
              onClick={() => handleSelectOption(habit.id)}
              className="cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-[var(--text-primary)]">
                      {habit.action}
                    </h3>
                    {isRecommended && (
                      <span className="rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-xs text-white">
                        Best match
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-sm text-[var(--success)] shrink-0">
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-sm text-[var(--text-secondary)]">
                  {habit.whyWeek1}
                </p>

                {hasQuestionnaire && habit.fitReasons.length > 0 && (
                  <div className="rounded-md bg-[var(--bg-tertiary)] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                      Why this fits you
                    </p>
                    <ul className="space-y-1">
                      {habit.fitReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-[var(--success)]">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-[var(--text-tertiary)]">
                  <span className="font-medium">Suggested anchor:</span> {habit.suggestedAnchor}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Week 1 is about showing up.</strong>{" "}
          These are intentionally small actions. Once the habit is automatic, you can grow it naturally.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedId}
        size="lg"
        className="w-full"
      >
        This is my Week-1 habit
      </Button>
    </div>
  );
}

function isCompleteAnswers(answers: QuestionnaireAnswers): boolean {
  return !!(
    answers.timing &&
    answers.barrier &&
    answers.experience
  );
}
