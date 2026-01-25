"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { saveConsultSelection } from "@/lib/store/habitStore";
import { DOMAINS, DomainInfo, SubProblemInfo, HabitDomain } from "@/types/habit";

interface IntentStepProps {
  onComplete: () => void;
}

export default function IntentStep({ onComplete }: IntentStepProps) {
  const [freeText, setFreeText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainInfo | null>(null);
  const [selectedSubProblem, setSelectedSubProblem] = useState<SubProblemInfo | null>(null);

  // User can proceed if they've typed something OR selected a sub-problem
  const canProceed = freeText.trim().length > 0 || selectedSubProblem !== null;

  const handleDomainSelect = (domain: DomainInfo) => {
    if (selectedDomain?.id === domain.id) {
      // Deselect if clicking the same domain
      setSelectedDomain(null);
      setSelectedSubProblem(null);
    } else {
      setSelectedDomain(domain);
      setSelectedSubProblem(null);
    }
  };

  const handleSubProblemSelect = (subProblem: SubProblemInfo) => {
    setSelectedSubProblem(subProblem);
    // Don't clear free text - allow both selection AND additional context
    console.log("[IntentStep] SubProblem selected:", subProblem.id, subProblem.label);
  };

  const handleFreeTextChange = (value: string) => {
    setFreeText(value);
    // FIXED: Don't clear structured selection when typing
    // This allows users to select a domain/subproblem AND add context
    console.log("[IntentStep] Free text changed:", value.slice(0, 50));
    console.log("[IntentStep] Current selection preserved:", selectedDomain?.id, selectedSubProblem?.id);
  };

  const handleComplete = () => {
    if (!canProceed) return;

    console.log("[IntentStep] handleComplete called");
    console.log("[IntentStep] selectedDomain:", selectedDomain?.id);
    console.log("[IntentStep] selectedSubProblem:", selectedSubProblem?.id);
    console.log("[IntentStep] freeText:", freeText.slice(0, 50));

    // Priority: Use pill selection if available, fall back to free-text only
    if (selectedSubProblem && selectedDomain) {
      // User chose structured path (with or without additional context)
      console.log("[IntentStep] Saving structured selection:", selectedDomain.id, selectedSubProblem.id);
      saveConsultSelection("domain", selectedDomain.id);
      saveConsultSelection("subProblem", selectedSubProblem.id);
      saveConsultSelection("intent", selectedSubProblem.label);

      // Also save free-text as additional context if provided
      if (freeText.trim()) {
        console.log("[IntentStep] Also saving additional context:", freeText.trim().slice(0, 50));
        saveConsultSelection("additionalContext", freeText.trim());
      }
    } else if (freeText.trim()) {
      // User typed free-text only (no pill selection)
      // Try to match keywords to appropriate domain/subproblem
      const text = freeText.trim().toLowerCase();
      let domain = "health";
      let subProblem = "exercise_start";

      // Keyword matching for common intents
      if (text.includes("sleep") || text.includes("bed") || text.includes("wake") || text.includes("tired") || text.includes("rest")) {
        domain = "health";
        subProblem = "sleep_improve";
      } else if (text.includes("exercise") || text.includes("workout") || text.includes("gym") || text.includes("run") || text.includes("fitness") || text.includes("move")) {
        domain = "health";
        subProblem = "exercise_start";
      } else if (text.includes("eat") || text.includes("food") || text.includes("diet") || text.includes("nutrition") || text.includes("healthy eating")) {
        domain = "health";
        subProblem = "eat_better";
      } else if (text.includes("water") || text.includes("hydrat") || text.includes("drink")) {
        domain = "health";
        subProblem = "hydration";
      } else if (text.includes("money") || text.includes("budget") || text.includes("saving") || text.includes("spend") || text.includes("financ")) {
        domain = "finances";
        subProblem = "track_spending";
      } else if (text.includes("read") || text.includes("book")) {
        domain = "learning";
        subProblem = "read_more";
      } else if (text.includes("clean") || text.includes("tidy") || text.includes("organiz") || text.includes("declutter")) {
        domain = "home";
        subProblem = "keep_tidy";
      } else if (text.includes("family") || text.includes("friend") || text.includes("relationship") || text.includes("connect")) {
        domain = "relationships";
        subProblem = "stay_connected";
      }

      console.log("[IntentStep] Free-text keyword match:", text.slice(0, 30), "→", domain, subProblem);
      saveConsultSelection("additionalContext", freeText.trim());
      saveConsultSelection("intent", freeText.trim());
      saveConsultSelection("domain", domain as HabitDomain);
      saveConsultSelection("subProblem", subProblem);
    }

    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          What feels stuck right now?
        </h1>
        <p className="text-[var(--text-secondary)]">
          Describe what you want to change, or pick from common challenges below.
        </p>
      </div>

      {/* Free-text input — PRIMARY */}
      <div>
        <textarea
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          placeholder="e.g., I keep saying I'll exercise but never do, I want to read more but always scroll instead, I can't stick to a budget..."
          rows={3}
          className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--bg-tertiary)]" />
        <span className="text-sm text-[var(--text-tertiary)]">
          or pick a common challenge
        </span>
        <div className="h-px flex-1 bg-[var(--bg-tertiary)]" />
      </div>

      {/* Domain pills — SECONDARY */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((domain) => (
          <button
            key={domain.id}
            onClick={() => handleDomainSelect(domain)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedDomain?.id === domain.id
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)]"
            }`}
          >
            {domain.label}
          </button>
        ))}
      </div>

      {/* Sub-problems — appear when domain selected */}
      {selectedDomain && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            What specifically?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedDomain.subProblems.map((subProblem) => (
              <Card
                key={subProblem.id}
                selected={selectedSubProblem?.id === subProblem.id}
                onClick={() => handleSubProblemSelect(subProblem)}
                className="cursor-pointer"
              >
                <div className="space-y-1">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {subProblem.label}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {subProblem.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selection indicator - shows pill selection AND/OR free-text */}
      {(selectedSubProblem || freeText.trim()) && (
        <div className="rounded-lg bg-[var(--success-subtle)] p-3">
          <div className="space-y-1 text-sm text-[var(--success)]">
            {selectedSubProblem && (
              <p>
                <span className="font-medium">Selected:</span> {selectedSubProblem.label}
              </p>
            )}
            {freeText.trim() && (
              <p>
                <span className="font-medium">{selectedSubProblem ? "Context:" : "Your focus:"}</span>{" "}
                {freeText.trim().slice(0, 60)}
                {freeText.trim().length > 60 && "..."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Continue button */}
      <Button
        onClick={handleComplete}
        disabled={!canProceed}
        size="lg"
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
