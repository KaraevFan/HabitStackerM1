"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveConsultSelection, loadHabitData } from "@/lib/store/habitStore";
import { getSubProblemById } from "@/types/habit";
import {
  QUESTIONNAIRE,
  generateInferenceSummary,
  type QuestionnaireAnswers,
  type CompleteQuestionnaireAnswers,
} from "@/lib/playbooks";

interface QuestionnaireStepProps {
  onComplete: () => void;
}

type Phase = "questions" | "confirm";

export default function QuestionnaireStep({ onComplete }: QuestionnaireStepProps) {
  const [phase, setPhase] = useState<Phase>("questions");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  const habitData = loadHabitData();
  const domain = habitData?.consultSelections.domain;
  const subProblemId = habitData?.consultSelections.subProblem;
  const subProblem = domain && subProblemId ? getSubProblemById(domain, subProblemId) : null;

  const question = QUESTIONNAIRE[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONNAIRE.length - 1;
  const allAnswered = QUESTIONNAIRE.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (value: string) => {
    const newAnswers = {
      ...answers,
      [question.id]: value,
    };
    setAnswers(newAnswers);

    // Auto-advance to next question after a brief delay
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
      }, 150);
    }
  };

  const handleContinueToConfirm = () => {
    if (allAnswered) {
      setPhase("confirm");
    }
  };

  const handleConfirm = () => {
    // Save answers to habit store
    saveConsultSelection("questionnaire", answers as QuestionnaireAnswers);
    onComplete();
  };

  const handleEdit = () => {
    setPhase("questions");
    setCurrentQuestion(0);
  };

  // Phase 1: Questions
  if (phase === "questions") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Quick context
          </h1>
          <p className="text-[var(--text-secondary)]">
            To recommend the right starting point, I need to know a few things about you.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {QUESTIONNAIRE.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentQuestion
                  ? "w-6 bg-[var(--accent-primary)]"
                  : answers[q.id]
                    ? "bg-[var(--text-tertiary)]"
                    : "bg-[var(--bg-tertiary)]"
              }`}
              aria-label={`Question ${idx + 1}`}
            />
          ))}
        </div>

        {/* Current question */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            {question.question}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => (
              <Card
                key={option.value}
                selected={answers[question.id] === option.value}
                onClick={() => handleAnswer(option.value)}
                className="cursor-pointer"
              >
                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {option.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-30"
          >
            ← Previous
          </button>

          {isLastQuestion && allAnswered ? (
            <Button onClick={handleContinueToConfirm} size="lg">
              Continue
            </Button>
          ) : (
            <button
              onClick={() => setCurrentQuestion((prev) => Math.min(QUESTIONNAIRE.length - 1, prev + 1))}
              disabled={!answers[question.id] || isLastQuestion}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-30"
            >
              Next →
            </button>
          )}
        </div>

        {/* Quick complete if all answered but not on last question */}
        {allAnswered && !isLastQuestion && (
          <div className="text-center">
            <Button onClick={handleContinueToConfirm} variant="secondary" size="sm">
              All answered — Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Phase 2: Confirm inference
  if (phase === "confirm" && allAnswered) {
    const completeAnswers: CompleteQuestionnaireAnswers = {
      timing: answers.timing!,
      barrier: answers.barrier!,
      experience: answers.experience!,
    };
    const inference = generateInferenceSummary(
      completeAnswers,
      subProblem?.label || ""
    );

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Here&apos;s what I&apos;m hearing
          </h1>
        </div>

        {/* Inference summary - the pattern recognition */}
        <div className="rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--accent-subtle)] p-5">
          <p className="text-lg font-medium text-[var(--text-primary)] leading-relaxed">
            {inference.summary}
          </p>
        </div>

        {/* Insight block - the reframe */}
        <div className="rounded-lg bg-[var(--success-subtle)] p-4">
          <p className="text-[var(--success)] leading-relaxed">
            {inference.barrierInsight}
          </p>
        </div>

        {/* Timing detail */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <span>⏰</span>
          <span>{inference.timingInsight}</span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleConfirm} size="lg" className="w-full">
            Yes, that&apos;s me
          </Button>

          <button
            onClick={handleEdit}
            className="w-full text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Let me adjust my answers
          </button>
        </div>
      </div>
    );
  }

  return null;
}
