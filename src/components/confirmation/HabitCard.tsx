'use client';

import { HabitRecommendation } from '@/lib/ai/prompts/intakeAgent';

interface HabitCardProps {
  recommendation: HabitRecommendation;
}

export default function HabitCard({ recommendation }: HabitCardProps) {
  return (
    <div className="space-y-6">
      {/* Your Habit */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-4">
          Your Habit
        </h2>

        <div className="space-y-4">
          {/* Anchor */}
          <div className="flex items-start gap-3">
            <span className="text-xl">&#x23F0;</span>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Anchor</p>
              <p className="text-[var(--text-primary)] font-medium">
                {recommendation.anchor}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-start gap-3">
            <span className="text-xl">&#x2192;</span>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Action</p>
              <p className="text-[var(--text-primary)] font-medium">
                {recommendation.action}
              </p>
            </div>
          </div>

          {/* Follow-up (if present) */}
          {recommendation.followUp && (
            <div className="flex items-start gap-3">
              <span className="text-xl">&#x2192;</span>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">Then</p>
                <p className="text-[var(--text-primary)] font-medium">
                  {recommendation.followUp}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why This Fits You */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
          Why This Fits You
        </h2>
        <ul className="space-y-2">
          {recommendation.whyItFits.map((reason, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-[var(--text-tertiary)] mt-1">&#x2022;</span>
              <span className="text-[var(--text-secondary)]">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* If You Miss */}
      <div className="bg-[var(--accent-subtle)] rounded-xl border border-[var(--bg-tertiary)] p-5">
        <h2 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
          If You Miss
        </h2>
        <p className="text-[var(--text-secondary)]">{recommendation.recovery}</p>
      </div>
    </div>
  );
}
