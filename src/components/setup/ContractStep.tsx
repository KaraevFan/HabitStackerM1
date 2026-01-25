"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { loadHabitData, logEvent, activateHabit } from "@/lib/store/habitStore";
import { HabitSnapshot, PlanDetails } from "@/types/habit";

interface ContractStepProps {
  onComplete: () => void;
}

export default function ContractStep({ onComplete }: ContractStepProps) {
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

  const handleDefer = () => {
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

  // First rep screen
  if (showFirstRep) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Your first rep
          </h1>
          <p className="text-[var(--text-secondary)]">
            This takes 2 minutes or less. You&apos;ve got this.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-sm text-[var(--text-tertiary)]">Your action:</p>
          <p className="text-xl font-medium text-[var(--text-primary)]">
            {planDetails.action}
          </p>
          {planDetails.prime && (
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              Tip: {planDetails.prime}
            </p>
          )}
        </div>

        {isCompleting ? (
          <div className="rounded-xl bg-[var(--success-subtle)] p-6 text-center">
            <div className="mb-2 text-3xl">✓</div>
            <p className="font-medium text-[var(--success)]">
              Rep logged. You&apos;re officially started.
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
              onClick={handleDefer}
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

  // Contract screen
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Your Week-1 Contract
        </h1>
        <p className="text-[var(--text-secondary)]">
          This is your system. It&apos;s designed to survive your worst days.
        </p>
      </div>

      {/* The 2-line contract */}
      <div className="rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--bg-secondary)] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-xl font-semibold text-[var(--text-primary)]">
          {snapshot.line1}
        </p>
        <p className="mt-3 text-lg text-[var(--text-secondary)]">
          {snapshot.line2}
        </p>
      </div>

      {/* System summary */}
      <div className="rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">Anchor:</span>
            <span className="text-[var(--text-primary)]">{planDetails.anchor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">Action:</span>
            <span className="text-[var(--text-primary)]">{planDetails.action}</span>
          </div>
          {planDetails.prime && (
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Prime:</span>
              <span className="text-[var(--text-primary)]">{planDetails.prime}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--text-tertiary)]">If you miss:</span>
            <span className="text-[var(--text-primary)]">{planDetails.recovery}</span>
          </div>
        </div>
      </div>

      {/* Why it survives */}
      <div className="rounded-lg bg-[var(--accent-subtle)] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Why this survives bad days
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Your anchor triggers automatically—you don&apos;t need to remember.
          If you miss, the 30-second recovery brings you right back.
          There&apos;s no &ldquo;starting over.&rdquo; Just continuity.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={handleStartFirstRep} size="lg" className="w-full">
          Start first rep now (≤2 min)
        </Button>
        <Button
          onClick={handleDefer}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          I&apos;ll start later
        </Button>
      </div>

      <p className="text-center text-xs text-[var(--text-tertiary)]">
        Starting now creates momentum. But it&apos;s fine to defer—your system is ready when you are.
      </p>
    </div>
  );
}
