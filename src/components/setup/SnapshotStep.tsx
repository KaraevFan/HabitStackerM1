"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { loadHabitData, logEvent, activateHabit } from "@/lib/store/habitStore";
import { HabitSnapshot, PlanDetails } from "@/types/habit";

interface SnapshotStepProps {
  onComplete: () => void;
}

export default function SnapshotStep({ onComplete }: SnapshotStepProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<HabitSnapshot | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [showFirstRep, setShowFirstRep] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const data = loadHabitData();
    setSnapshot(data.snapshot);
    setPlanDetails(data.planDetails);
  }, []);

  const handleStartFirstRep = () => {
    setShowFirstRep(true);
  };

  const handleCompleteFirstRep = () => {
    setIsCompleting(true);
    logEvent("rep_done");
    activateHabit();

    // Brief delay for feedback, then redirect
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  const handleNotNow = () => {
    activateHabit();
    router.push("/");
  };

  if (!snapshot || !planDetails) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-[var(--text-tertiary)]">Loading your plan...</p>
      </div>
    );
  }

  if (showFirstRep) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Your first rep
          </h1>
          <p className="text-[var(--text-secondary)]">
            This takes 2 minutes or less.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-sm text-[var(--text-tertiary)]">Your action:</p>
          <p className="text-xl font-medium text-[var(--text-primary)]">
            {planDetails.action}
          </p>
        </div>

        {isCompleting ? (
          <div className="rounded-xl bg-[var(--success-subtle)] p-6 text-center">
            <div className="mb-2 text-3xl">✓</div>
            <p className="font-medium text-[var(--success)]">
              Rep logged. You&apos;re on your way.
            </p>
            <p className="mt-1 text-sm text-[var(--success)]">
              Reps: 1 | Last done: today
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={handleCompleteFirstRep} size="lg" className="w-full">
              Done
            </Button>
            <Button
              onClick={handleNotNow}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Not now
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Your Week 1 contract
        </h1>
        <p className="text-[var(--text-secondary)]">
          This is your system. It&apos;s designed to survive bad days.
        </p>
      </div>

      <div className="rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--bg-secondary)] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-xl font-semibold text-[var(--text-primary)]">
          {snapshot.line1}
        </p>
        <p className="mt-2 text-lg text-[var(--text-secondary)]">
          {snapshot.line2}
        </p>
      </div>

      <details className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
          Why this works
        </summary>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Tiny actions attached to existing routines are nearly impossible to skip.
          If you do miss, the 30-second recovery brings you right back.
          No lost progress—just continuity.
        </p>
      </details>

      <div className="space-y-3">
        <Button onClick={handleStartFirstRep} size="lg" className="w-full">
          Start today (2 min)
        </Button>
        <Button
          onClick={handleNotNow}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          I&apos;ll start later
        </Button>
      </div>
    </div>
  );
}
