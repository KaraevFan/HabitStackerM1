import { ConsultStep } from "@/types/habit";

interface StepProgressProps {
  steps: ConsultStep[];
  currentStep: ConsultStep;
  currentIndex: number;
}

const STEP_LABELS: Record<string, string> = {
  // Iteration 4 steps (reordered: Portrait before Questionnaire)
  intent: "Goal",
  success_map: "Portrait",
  questionnaire: "Context",
  habit_select: "Habit",
  system_design: "System",
  contract: "Start",
  // Legacy steps (kept for backwards compatibility)
  orientation: "Overview",
  success_week: "This Week",
  anchor: "Anchor",
  action: "Planning",
  snapshot: "Confirm",
};

export default function StepProgress({
  steps,
  currentIndex,
}: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isComplete
                    ? "bg-[var(--success)] text-white"
                    : isCurrent
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isCurrent
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {STEP_LABELS[step] || step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 ${
                  isComplete ? "bg-[var(--success)]" : "bg-[var(--bg-tertiary)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
