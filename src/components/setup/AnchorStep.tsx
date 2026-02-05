"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveConsultSelection, loadHabitData } from "@/lib/store/habitStore";
import { useConsultAI } from "@/lib/ai/useConsultAI";
import { ConsultOption } from "@/types/habit";

interface AnchorStepProps {
  onComplete: () => void;
}

export default function AnchorStep({ onComplete }: AnchorStepProps) {
  const [options, setOptions] = useState<ConsultOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAnchor, setCustomAnchor] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const { isLoading, usedFallback, generate } = useConsultAI();

  useEffect(() => {
    async function loadOptions() {
      const data = loadHabitData();
      const result = await generate("anchor", data.consultSelections);
      if (result) {
        setOptions(result.options);
        setRecommendedId(result.recommended_id);
      } else {
        // Fallback options
        setOptions(getAnchorFallback(data.consultSelections.intent || ""));
        setRecommendedId("morning");
      }
    }
    loadOptions();
  }, [generate]);

  const handleSubmit = () => {
    let anchor: string;

    if (showCustom && customAnchor.trim()) {
      anchor = customAnchor.trim();
    } else if (selectedId) {
      const option = options.find((o) => o.id === selectedId);
      anchor = option?.title || "";
    } else {
      return;
    }

    saveConsultSelection("anchor", anchor);
    onComplete();
  };

  const isValid = (selectedId && !showCustom) || (showCustom && customAnchor.trim());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Choose your anchor
          </h1>
          <p className="text-[var(--text-secondary)]">
            Finding the best trigger for your habit...
          </p>
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)]" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          When will you do this?
        </h1>
        <p className="text-[var(--text-secondary)]">
          Attach your habit to an existing routine. This is your trigger.
        </p>
      </div>

      {usedFallback && (
        <div className="rounded-lg bg-[var(--warning)]/10 p-3 text-sm text-[var(--warning)]">
          Using suggested options (AI temporarily unavailable)
        </div>
      )}

      {!showCustom && (
        <div className="space-y-3">
          {options.map((option) => (
            <Card
              key={option.id}
              selected={selectedId === option.id}
              onClick={() => setSelectedId(option.id)}
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
      )}

      {showCustom ? (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Describe your anchor routine
            </label>
            <input
              type="text"
              value={customAnchor}
              onChange={(e) => setCustomAnchor(e.target.value)}
              placeholder="After I..."
              className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <button
            onClick={() => setShowCustom(false)}
            className="text-sm text-[var(--text-tertiary)] underline hover:text-[var(--text-secondary)]"
          >
            Choose from suggestions instead
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="text-sm text-[var(--text-tertiary)] underline hover:text-[var(--text-secondary)]"
        >
          Write my own anchor
        </button>
      )}

      <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Why anchors work:</strong>{" "}
          Attaching new habits to existing routines uses your brain&apos;s autopilot.
          You don&apos;t have to decide when to do it — the trigger decides for you.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        size="lg"
        className="w-full"
      >
        Lock this anchor
      </Button>
    </div>
  );
}

function getAnchorFallback(intent: string): ConsultOption[] {
  const intentLower = intent.toLowerCase();

  if (intentLower.includes("run") || intentLower.includes("exercise") || intentLower.includes("workout")) {
    return [
      {
        id: "morning",
        title: "After morning coffee",
        description: "Use your coffee ritual as the trigger. Finish coffee → put on shoes.",
        why: "Coffee is a reliable daily ritual. Energy is often higher in the morning.",
      },
      {
        id: "lunch",
        title: "After lunch",
        description: "Use your lunch break as the trigger. Finish eating → move.",
        why: "Midday movement helps with afternoon energy. Lunch is a consistent break.",
      },
      {
        id: "evening",
        title: "After getting home",
        description: "Use arriving home as the trigger. Walk in → change into workout clothes.",
        why: "Transition moments are powerful. Changing clothes signals a mode shift.",
      },
    ];
  }

  // Default anchors
  return [
    {
      id: "morning",
      title: "After morning coffee",
      description: "Attach to your morning coffee or breakfast routine.",
      why: "Morning routines are reliable. Starting the day with your habit builds momentum.",
    },
    {
      id: "lunch",
      title: "After lunch",
      description: "Use your lunch break as the trigger moment.",
      why: "Midday is a natural transition. You're already taking a break.",
    },
    {
      id: "evening",
      title: "After dinner",
      description: "Attach to your evening meal as the trigger.",
      why: "Dinner is consistent. Evening habits help you wind down intentionally.",
    },
  ];
}
