"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { loadHabitData, completeConsult, setConsultStep } from "@/lib/store/habitStore";
import { useConsultAI } from "@/lib/ai/useConsultAI";
import { PlanDetails, HabitSnapshot, ConsultOption } from "@/types/habit";

interface PlanningStepProps {
  onComplete: () => void;
  flowType: "setup" | "recurring" | "mixed";
}

interface ParsedPlan {
  anchor: string;
  action: string;
  prime: string | null;
  recovery: string;
}

function parsePlanOption(option: ConsultOption): ParsedPlan {
  const desc = option.description;

  const anchorMatch = desc.match(/After\s+([^,]+),/i);
  const anchor = anchorMatch ? `After ${anchorMatch[1].trim()}` : "";

  let action = "";
  if (anchorMatch) {
    const actionMatch = desc.match(/,\s*([^.]+?)\.?\s*(?:Prime:|If missed:|$)/i);
    action = actionMatch ? actionMatch[1].trim() : "";
  } else {
    const actionMatch = desc.match(/^([^.]+?)\.?\s*(?:Prime:|If missed:|$)/i);
    action = actionMatch ? actionMatch[1].trim() : "";
  }
  if (!action) action = "Spend 2 minutes on this habit";

  const primeMatch = desc.match(/Prime:\s*([^.]+?)\.?\s*(?:If missed:|$)/i);
  const prime = primeMatch ? primeMatch[1].trim() : null;

  const recoveryMatch = desc.match(/If missed:\s*([^.]+)/i);
  const recovery = recoveryMatch ? recoveryMatch[1].trim() : "Do the tiniest version for 30 seconds";

  return { anchor, action, prime, recovery };
}

function generateSnapshot(successWeek: string, plan: ParsedPlan): HabitSnapshot {
  const line1Map: Record<string, string> = {
    "show-up": "Week 1: Just show up.",
    "same-time": "Week 1: Same time, every day.",
    "no-pressure": "Week 1: Zero pressure.",
  };

  const line2 = plan.anchor
    ? `${plan.anchor}, ${plan.action.toLowerCase()}.`
    : `${plan.action}.`;

  return {
    line1: line1Map[successWeek] || "Week 1: Show up.",
    line2,
  };
}

export default function PlanningStep({ onComplete, flowType }: PlanningStepProps) {
  const [options, setOptions] = useState<ConsultOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editedPlan, setEditedPlan] = useState<ParsedPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isLoading, usedFallback, generate } = useConsultAI();

  useEffect(() => {
    async function loadOptions() {
      const data = loadHabitData();
      const result = await generate("action", data.consultSelections);
      if (result) {
        setOptions(result.options);
        setRecommendedId(result.recommended_id);
      }
    }
    loadOptions();
  }, [generate]);

  const handleSelectOption = (optionId: string) => {
    setSelectedId(optionId);
    const option = options.find((o) => o.id === optionId);
    if (option) {
      const parsed = parsePlanOption(option);

      if (flowType === "recurring") {
        const data = loadHabitData();
        if (data.consultSelections.anchor) {
          parsed.anchor = data.consultSelections.anchor;
        }
      }

      setEditedPlan(parsed);
    }
  };

  const handleContinue = () => {
    if (!selectedId) return;
    setShowDetails(true);
  };

  const handleAccept = () => {
    if (!editedPlan) return;

    const data = loadHabitData();
    const successWeek = data.consultSelections.success_week || "show-up";

    const planDetails: PlanDetails = {
      anchor: editedPlan.anchor,
      action: editedPlan.action,
      prime: editedPlan.prime,
      recovery: editedPlan.recovery,
    };

    const snapshot = generateSnapshot(successWeek, editedPlan);

    completeConsult(planDetails, snapshot);
    setConsultStep("snapshot");
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Your Week 1 plan
          </h1>
          <p className="text-[var(--text-secondary)]">
            Designing a survivable system for you...
          </p>
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)]" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (showDetails && editedPlan) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Your Week 1 plan
          </h1>
          <p className="text-[var(--text-secondary)]">
            Review and adjust if needed.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <PlanItem
              label="Anchor"
              sublabel="When does this happen?"
              value={editedPlan.anchor}
              isEditing={isEditing}
              onChange={(v) => setEditedPlan({ ...editedPlan, anchor: v })}
            />

            <div className="border-t border-[var(--bg-tertiary)]" />

            <PlanItem
              label="Action"
              sublabel="≤2 minutes"
              value={editedPlan.action}
              isEditing={isEditing}
              onChange={(v) => setEditedPlan({ ...editedPlan, action: v })}
            />

            <div className="border-t border-[var(--bg-tertiary)]" />

            <PlanItem
              label="Prime"
              sublabel="≤30 seconds, optional"
              value={editedPlan.prime || ""}
              isEditing={isEditing}
              onChange={(v) => setEditedPlan({ ...editedPlan, prime: v || null })}
              optional
            />

            <div className="border-t border-[var(--bg-tertiary)]" />

            <PlanItem
              label="Recovery"
              sublabel="≤30 seconds, for missed days"
              value={editedPlan.recovery}
              isEditing={isEditing}
              onChange={(v) => setEditedPlan({ ...editedPlan, recovery: v })}
            />
          </Card>

          <div className="flex justify-between">
            <button
              onClick={() => setShowDetails(false)}
              className="text-sm text-[var(--text-tertiary)] underline hover:text-[var(--text-secondary)]"
            >
              Choose different option
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-[var(--text-tertiary)] underline hover:text-[var(--text-secondary)]"
            >
              {isEditing ? "Done editing" : "Make adjustments"}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Why this works:</strong>{" "}
            Tiny actions attached to existing routines are nearly impossible to skip. If you miss, the recovery action gets you back immediately.
          </p>
        </div>

        <Button onClick={handleAccept} size="lg" className="w-full">
          Accept this plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Choose your approach
        </h1>
        <p className="text-[var(--text-secondary)]">
          Here are personalized plans based on what you told me.
        </p>
      </div>

      {usedFallback && (
        <div className="rounded-lg bg-[var(--warning)]/10 p-3 text-sm text-[var(--warning)]">
          Using suggested options (AI temporarily unavailable)
        </div>
      )}

      <div className="space-y-3">
        {options.map((option) => (
          <Card
            key={option.id}
            selected={selectedId === option.id}
            onClick={() => handleSelectOption(option.id)}
            className="cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {option.title}
                  </h3>
                  {recommendedId === option.id && (
                    <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                      Recommended
                    </span>
                  )}
                </div>
                {selectedId === option.id && (
                  <span className="text-sm text-[var(--success)]">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {option.description}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] italic">
                Why: {option.why}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedId}
        size="lg"
        className="w-full"
      >
        Continue with this plan
      </Button>
    </div>
  );
}

interface PlanItemProps {
  label: string;
  sublabel: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  optional?: boolean;
}

function PlanItem({ label, sublabel, value, isEditing, onChange, optional }: PlanItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{sublabel}</span>
      </div>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={optional ? "Optional" : ""}
          className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        />
      ) : (
        <p className="text-[var(--text-secondary)]">
          {value || <span className="italic text-[var(--text-tertiary)]">Not set</span>}
        </p>
      )}
    </div>
  );
}
