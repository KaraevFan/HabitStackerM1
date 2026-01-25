"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { loadHabitData } from "@/lib/store/habitStore";
import { getDomainById, getSubProblemById, HabitDomain } from "@/types/habit";
import { getPlaybook, type DomainPlaybook } from "@/lib/playbooks";

interface SuccessMapStepProps {
  onComplete: () => void;
}

/**
 * Generate fallback playbook if none exists
 */
function getFallbackPlaybook(
  domainId: HabitDomain | undefined,
  subProblemId: string | undefined
): DomainPlaybook {
  return {
    domainId: domainId || "health",
    subProblemId: subProblemId || "default",
    portrait: [
      "They don't rely on motivation — they have a routine that runs on autopilot",
      "They started embarrassingly small and built from there",
      "They treat this habit as non-negotiable, like brushing teeth",
      "They recover from breaks quickly because the habit is simple to restart",
    ],
    progression: {
      week1: "Show up and do the smallest possible action",
      month1: "Consistent practice 4-5 days/week, even if brief",
      month3: "Natural urge to continue; the habit feels rewarding, not forced",
    },
    traps: [
      "Starting too ambitious (big commitments that become unsustainable)",
      "All-or-nothing thinking (skipping entirely if you can't do the 'full' version)",
      "Waiting for motivation instead of building a trigger",
    ],
    leveragePoints: [
      "Anchor the action to something you already do every day",
      "Make the starting action so small it feels almost silly",
    ],
    smallToBig: "A 2-minute daily habit becomes a 20-minute habit in weeks, not because you push harder, but because showing up builds the neural pathways that make it feel natural.",
    candidateHabits: [],
  };
}

export default function SuccessMapStep({ onComplete }: SuccessMapStepProps) {
  const [playbook, setPlaybook] = useState<DomainPlaybook | null>(null);
  const [subProblemLabel, setSubProblemLabel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    const domainId = data.consultSelections.domain;
    const subProblemId = data.consultSelections.subProblem;

    console.log("[SuccessMapStep] Loading playbook for:", domainId, subProblemId);
    console.log("[SuccessMapStep] Full consultSelections:", data.consultSelections);

    // Get sub-problem label for display
    if (domainId && subProblemId) {
      const subProblem = getSubProblemById(domainId, subProblemId);
      setSubProblemLabel(subProblem?.label || "");
    }

    // Get playbook or fallback
    const pb = domainId && subProblemId
      ? getPlaybook(domainId, subProblemId)
      : null;

    console.log("[SuccessMapStep] Playbook found:", pb ? pb.subProblemId : "USING FALLBACK");

    setPlaybook(pb || getFallbackPlaybook(domainId, subProblemId));
    setIsLoading(false);
  }, []);

  if (isLoading || !playbook) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            What excellence looks like
          </h1>
          <p className="text-[var(--text-secondary)]">
            Building your roadmap...
          </p>
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          What success actually looks like
        </h1>
        <p className="text-[var(--text-secondary)]">
          Before we design your system, here&apos;s what I know about people who build lasting habits in this area.
        </p>
      </div>

      {/* Portrait of Excellence */}
      <div className="rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--accent-subtle)] p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          People who succeed at this
        </h2>
        <ul className="space-y-2">
          {playbook.portrait.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 text-[var(--text-tertiary)]">•</span>
              <span className="text-[var(--text-primary)]">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Progression Ladder */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          The journey
        </h2>
        <div className="grid gap-3">
          {/* Week 1 - emphasized */}
          <div className="rounded-lg border-2 border-[var(--accent-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-sm font-bold text-white">
                W1
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Week 1 — Where you start
                </p>
                <p className="font-medium text-[var(--text-primary)]">
                  {playbook.progression.week1}
                </p>
              </div>
            </div>
          </div>

          {/* Month 1 */}
          <div className="rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-secondary)]">
                M1
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Month 1
                </p>
                <p className="text-[var(--text-secondary)]">
                  {playbook.progression.month1}
                </p>
              </div>
            </div>
          </div>

          {/* Month 3 */}
          <div className="rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-secondary)]">
                M3
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Month 3
                </p>
                <p className="text-[var(--text-secondary)]">
                  {playbook.progression.month3}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Traps */}
      <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--warning)]">
          <span>⚠️</span> Common traps to avoid
        </h2>
        <ul className="space-y-1">
          {playbook.traps.map((trap, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--warning)]">
              <span className="mt-0.5">•</span>
              <span>{trap}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Leverage Points */}
      <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success-subtle)] p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--success)]">
          <span>✓</span> Highest-leverage starting moves
        </h2>
        <ul className="space-y-1">
          {playbook.leveragePoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--success)]">
              <span className="mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why small leads to big */}
      <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Why starting small works
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {playbook.smallToBig}
        </p>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        This makes sense
      </Button>
    </div>
  );
}
