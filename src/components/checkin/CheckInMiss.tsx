'use client';

import { useState } from 'react';
import { MISS_REASONS } from '@/lib/education/whispers';

interface CheckInMissProps {
  isReactiveHabit?: boolean;
  onSelectReason: (reason: string | null) => void;
  onSkip: () => void;
}

/**
 * Get miss reason options based on habit type
 */
function getMissReasonOptions(isReactive: boolean): { id: string; label: string }[] {
  if (isReactive) {
    return [
      { id: MISS_REASONS.TOO_TIRED, label: 'Too tired to get up' },
      { id: MISS_REASONS.FORGOT, label: 'Forgot in the moment' },
      { id: MISS_REASONS.TOO_COLD, label: 'The other room was too cold/far' },
      { id: MISS_REASONS.FIVE_MORE_MINUTES, label: 'Told myself "just 5 more minutes"' },
    ];
  }

  return [
    { id: MISS_REASONS.TIME, label: "Didn't have time" },
    { id: MISS_REASONS.FORGOT, label: 'Forgot in the moment' },
    { id: MISS_REASONS.NOT_FEELING, label: "Wasn't feeling up to it" },
    { id: MISS_REASONS.SOMETHING_ELSE, label: 'Something else came up' },
  ];
}

/**
 * Screen shown after user indicates they missed
 * Captures the reason to enable pattern finding and personalized tips
 */
export default function CheckInMiss({
  isReactiveHabit = false,
  onSelectReason,
  onSkip,
}: CheckInMissProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const options = getMissReasonOptions(isReactiveHabit);

  const handleSelect = (reasonId: string) => {
    setSelected(reasonId);
    // Brief delay so user sees selection
    setTimeout(() => onSelectReason(reasonId), 150);
  };

  return (
    <div className="miss-screen">
      <div className="miss-content">
        <h1 className="miss-title">That&apos;s okay.</h1>

        <p className="miss-message">
          {isReactiveHabit
            ? "This is genuinely hard at 2am. Your brain wants the easy thing."
            : "Missing happens. What matters is what you do next."}
        </p>

        <div className="divider" />

        <p className="reason-prompt">
          What got in the way? <span className="helps">(helps me learn)</span>
        </p>

        <div className="reason-options">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`reason-button ${selected === option.id ? 'selected' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button onClick={onSkip} className="skip-button">
          Skip this
        </button>
      </div>

      <style jsx>{`
        .miss-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 24px;
        }

        .miss-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .miss-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .miss-message {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 24px 0;
          max-width: 300px;
        }

        .divider {
          width: 64px;
          height: 1px;
          background: var(--bg-tertiary);
          margin-bottom: 24px;
        }

        .reason-prompt {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
        }

        .helps {
          color: var(--text-tertiary);
        }

        .reason-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 320px;
        }

        .reason-button {
          width: 100%;
          padding: 14px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          font-size: 14px;
          color: var(--text-primary);
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .reason-button:hover {
          border-color: var(--accent-primary);
        }

        .reason-button.selected {
          background: var(--accent-subtle);
          border-color: var(--accent-primary);
        }

        .skip-button {
          margin-top: 24px;
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .skip-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
