"use client";

import Button from "@/components/ui/Button";

interface OrientationStepProps {
  onComplete: () => void;
}

const PHASES = [
  {
    name: "Show Up",
    description: "Week 1-2: Just do the tiny action. No pressure for more.",
    status: "current",
  },
  {
    name: "Stabilize",
    description: "Week 3-4: Same time, same trigger. Build the routine.",
    status: "upcoming",
  },
  {
    name: "Build",
    description: "Week 5+: Gradually expand when it feels easy.",
    status: "upcoming",
  },
];

export default function OrientationStep({ onComplete }: OrientationStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          How this works
        </h1>
        <p className="text-[var(--text-secondary)]">
          Sustainable habits are built in phases. Here&apos;s what good looks like.
        </p>
      </div>

      <div className="space-y-4">
        {PHASES.map((phase, index) => (
          <div
            key={phase.name}
            className={`flex gap-4 rounded-lg border p-4 ${
              phase.status === "current"
                ? "border-[var(--accent-primary)] bg-[var(--accent-subtle)]"
                : "border-[var(--bg-tertiary)]"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                phase.status === "current"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              }`}
            >
              {index + 1}
            </div>
            <div>
              <h3
                className={`font-medium ${
                  phase.status === "current"
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {phase.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                {phase.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--bg-tertiary)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">You&apos;re starting with Phase 1.</strong>{" "}
          We&apos;ll focus only on showing up. Everything else comes later.
        </p>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        Got it
      </Button>
    </div>
  );
}
