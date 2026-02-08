"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { loadHabitData, completeConsult, setConsultStep } from "@/lib/store/habitStore";
import { getPlaybook } from "@/lib/playbooks";
import { PlanDetails, HabitSnapshot, TimingPreference } from "@/types/habit";
import { formatRitualStatement } from "@/lib/format";

interface SystemDesignStepProps {
  onComplete: () => void;
}

const ANCHOR_OPTIONS: Record<TimingPreference | "general", string[]> = {
  morning: [
    "After getting out of bed",
    "After brushing teeth",
    "After morning coffee",
    "After breakfast",
    "Before leaving for work",
  ],
  midday: [
    "After lunch",
    "Before afternoon coffee",
    "After the 2pm slump",
    "During lunch break",
  ],
  evening: [
    "After getting home from work",
    "After dinner",
    "After brushing teeth at night",
    "Before getting into bed",
  ],
  flexible: [
    "After any meal",
    "During a break",
    "When I sit down to work",
    "After checking my phone",
  ],
  general: [
    "After my first coffee",
    "When I wake up",
    "Before bed",
    "After a meal",
  ],
};

const DOMAIN_ANCHOR_OPTIONS: Record<string, string[]> = {
  sleep_improve: [
    "After brushing teeth at night",
    "After putting on pajamas",
    "When I get into bed",
    "After dinner cleanup",
    "After setting tomorrow's alarm",
    "When I turn off the TV",
  ],
};

interface HabitInfo {
  action: string;
  suggestedAnchor: string;
  suggestedRecovery: string;
  timing: TimingPreference;
  subProblemId: string;
}

export default function SystemDesignStep({ onComplete }: SystemDesignStepProps) {
  const [habitInfo, setHabitInfo] = useState<HabitInfo | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string>("");
  const [customAnchor, setCustomAnchor] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [isEditingRecovery, setIsEditingRecovery] = useState(false);

  useEffect(() => {
    const data = loadHabitData();
    const domainId = data.consultSelections.domain;
    const subProblemId = data.consultSelections.subProblem;
    const selectedHabitId = data.consultSelections.selectedHabitId;
    const timing = data.consultSelections.questionnaire?.timing || "flexible";

    console.log("[SystemDesignStep] Loading system for:", domainId, subProblemId);
    console.log("[SystemDesignStep] Selected habit ID:", selectedHabitId);
    console.log("[SystemDesignStep] Timing preference:", timing);

    let habitFound = false;

    if (domainId && subProblemId) {
      const playbook = getPlaybook(domainId, subProblemId);
      console.log("[SystemDesignStep] Playbook found:", playbook?.subProblemId);
      if (playbook) {
        const habit = playbook.candidateHabits.find(h => h.id === selectedHabitId);
        console.log("[SystemDesignStep] Habit found:", habit?.id, habit?.action);
        if (habit) {
          habitFound = true;
          const effectiveTiming = subProblemId === "sleep_improve" ? "evening" : timing as TimingPreference;
          setHabitInfo({
            action: habit.action,
            suggestedAnchor: habit.suggestedAnchor,
            suggestedRecovery: habit.suggestedRecovery,
            timing: effectiveTiming,
            subProblemId: subProblemId,
          });
          setSelectedAnchor(habit.suggestedAnchor);
          setRecovery(habit.suggestedRecovery);
        }
      }
    }

    if (!habitFound) {
      console.log("[SystemDesignStep] Using fallback - no habit found");
      const action = data.consultSelections.selectedHabit || data.consultSelections.intent || "your habit";
      const effectiveTiming = subProblemId === "sleep_improve" ? "evening" : timing as TimingPreference;
      const defaultAnchor = subProblemId === "sleep_improve" ? "After brushing teeth at night" : "After morning coffee";
      setHabitInfo({
        action,
        suggestedAnchor: defaultAnchor,
        suggestedRecovery: "Do the tiniest version for 30 seconds",
        timing: effectiveTiming,
        subProblemId: subProblemId || "default",
      });
      setSelectedAnchor(defaultAnchor);
      setRecovery("Do the tiniest version for 30 seconds");
    }
  }, []);

  const getAnchorOptions = (): string[] => {
    if (!habitInfo) return ANCHOR_OPTIONS.general;

    const domainAnchors = DOMAIN_ANCHOR_OPTIONS[habitInfo.subProblemId];
    if (domainAnchors) {
      console.log("[SystemDesignStep] Using domain-specific anchors for:", habitInfo.subProblemId);
      const options = [...domainAnchors];
      if (!options.includes(habitInfo.suggestedAnchor)) {
        options.unshift(habitInfo.suggestedAnchor);
      }
      return options.slice(0, 6);
    }

    const timingOptions = ANCHOR_OPTIONS[habitInfo.timing] || [];
    const generalOptions = ANCHOR_OPTIONS.general;

    const options = [...timingOptions];
    if (!options.includes(habitInfo.suggestedAnchor)) {
      options.unshift(habitInfo.suggestedAnchor);
    }

    for (const opt of generalOptions) {
      if (!options.includes(opt) && options.length < 6) {
        options.push(opt);
      }
    }

    return options.slice(0, 6);
  };

  const handleAnchorSelect = (anchor: string) => {
    setSelectedAnchor(anchor);
    setIsCustom(false);
    setCustomAnchor("");
  };

  const handleCustomAnchorChange = (value: string) => {
    setCustomAnchor(value);
    setIsCustom(true);
    setSelectedAnchor("");
  };

  const getEffectiveAnchor = (): string => {
    if (isCustom && customAnchor.trim()) {
      return customAnchor.trim();
    }
    return selectedAnchor;
  };

  const canProceed = getEffectiveAnchor().length > 0 && recovery.length > 0;

  const handleComplete = () => {
    if (!habitInfo || !canProceed) return;

    const anchor = getEffectiveAnchor();

    const planDetails: PlanDetails = {
      anchor,
      action: habitInfo.action,
      prime: null,
      recovery,
    };

    const snapshot: HabitSnapshot = {
      line1: "Week 1: Show up.",
      line2: formatRitualStatement(anchor, habitInfo.action),
    };

    completeConsult(planDetails, snapshot);
    setConsultStep("contract");
    onComplete();
  };

  if (!habitInfo) {
    return (
      <div className="space-y-6">
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)]" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  const anchorOptions = getAnchorOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          When will you do it?
        </h1>
        <p className="text-[var(--text-secondary)]">
          Pick a trigger moment. The more consistent it is, the faster the habit becomes automatic.
        </p>
      </div>

      <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">Your habit:</span>{" "}
          {habitInfo.action}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Attach it to an existing routine:
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {anchorOptions.map((anchor) => {
            const isSelected = selectedAnchor === anchor && !isCustom;
            const isRecommended = anchor === habitInfo.suggestedAnchor;

            return (
              <button
                key={anchor}
                onClick={() => handleAnchorSelect(anchor)}
                className={`rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{anchor}</span>
                  {isRecommended && !isSelected && (
                    <span className="shrink-0 text-xs text-[var(--text-tertiary)]">Suggested</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[var(--text-tertiary)]">Or write your own:</p>
          <input
            type="text"
            value={customAnchor}
            onChange={(e) => handleCustomAnchorChange(e.target.value)}
            placeholder="After I..."
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
              isCustom && customAnchor.trim()
                ? "border-[var(--accent-primary)] bg-[var(--accent-subtle)]"
                : "border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]"
            } text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            If you miss a day:
          </p>
          <button
            onClick={() => setIsEditingRecovery(!isEditingRecovery)}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {isEditingRecovery ? "Done" : "Edit"}
          </button>
        </div>

        {isEditingRecovery ? (
          <input
            type="text"
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            placeholder="A 30-second fallback action..."
            className="w-full rounded-lg border-2 border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        ) : (
          <Card className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Recovery action:</span>{" "}
            {recovery}
          </Card>
        )}

        <p className="text-xs text-[var(--text-tertiary)]">
          This 30-second fallback means a miss never breaks your momentum. You simply do the recovery and continue.
        </p>
      </div>

      {getEffectiveAnchor() && (
        <div className="rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--accent-subtle)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
            Your system
          </p>
          <p className="mt-2 text-lg font-medium text-[var(--text-primary)]">
            {formatRitualStatement(getEffectiveAnchor(), habitInfo.action)}
          </p>
        </div>
      )}

      <Button
        onClick={handleComplete}
        disabled={!canProceed}
        size="lg"
        className="w-full"
      >
        Lock in this system
      </Button>
    </div>
  );
}
