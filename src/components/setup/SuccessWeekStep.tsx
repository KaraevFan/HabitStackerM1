"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveConsultSelection, loadHabitData } from "@/lib/store/habitStore";
import { useConsultAI } from "@/lib/ai/useConsultAI";
import { ConsultOption } from "@/types/habit";

interface SuccessWeekStepProps {
  onComplete: () => void;
}

export default function SuccessWeekStep({ onComplete }: SuccessWeekStepProps) {
  const [options, setOptions] = useState<ConsultOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const { isLoading, usedFallback, generate } = useConsultAI();

  useEffect(() => {
    async function loadOptions() {
      const data = loadHabitData();
      const result = await generate("success_week", data.consultSelections);
      if (result) {
        setOptions(result.options);
        setRecommendedId(result.recommended_id);
      }
    }
    loadOptions();
  }, [generate]);

  const handleSubmit = () => {
    if (!selectedId) return;
    saveConsultSelection("success_week", selectedId);
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Define success for Week 1
          </h1>
          <p className="text-[var(--text-secondary)]">
            Generating personalized options...
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
          Define success for Week 1
        </h1>
        <p className="text-[var(--text-secondary)]">
          Pick one approach. This becomes your only goal.
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

      <Button
        onClick={handleSubmit}
        disabled={!selectedId}
        size="lg"
        className="w-full"
      >
        Lock this in
      </Button>
    </div>
  );
}
