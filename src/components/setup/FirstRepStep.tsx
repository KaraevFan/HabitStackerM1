"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { loadHabitData, logEvent, activateHabit } from "@/lib/store/habitStore";
import { PlanDetails } from "@/types/habit";

interface FirstRepStepProps {
  onComplete: () => void;
}

export default function FirstRepStep({ onComplete }: FirstRepStepProps) {
  const router = useRouter();
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const data = loadHabitData();
    setPlanDetails(data.planDetails);
  }, []);

  const handleComplete = () => {
    setIsCompleting(true);
    logEvent("rep_done");
    activateHabit();

    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  const handleNotNow = () => {
    activateHabit();
    router.push("/");
  };

  if (!planDetails) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-[var(--success-subtle)] p-8 text-center">
          <div className="mb-3 text-4xl">✓</div>
          <p className="text-xl font-medium text-[var(--success)]">
            Rep logged
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            Reps: 1 | Last done: today
          </p>
          <p className="mt-4 text-sm text-[var(--text-tertiary)]">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Your first rep
        </h1>
        <p className="text-[var(--text-secondary)]">
          This takes 2 minutes or less. Ready?
        </p>
      </div>

      <div className="rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="mb-2 text-sm text-[var(--text-tertiary)]">Your action:</p>
        <p className="text-xl font-medium text-[var(--text-primary)]">
          {planDetails.action}
        </p>
      </div>

      {planDetails.prime && (
        <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">
              Tomorrow&apos;s prime:
            </strong>{" "}
            {planDetails.prime}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button onClick={handleComplete} size="lg" className="w-full">
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
    </div>
  );
}
