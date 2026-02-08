'use client';

import Button from '@/components/ui/Button';
import { getHabitEmoji } from '@/types/habit';
import { formatRitualStatement } from '@/lib/format';

interface RitualRevealProps {
  anchor: string;
  action: string;
  ritualStatement?: string;
  whyItFits: string[];
  recovery: string;
  onNext: () => void;
  onBack: () => void;
  onAdjust: () => void;
}

/**
 * Screen 2: Ritual reveal
 * Shows the habit system with "This feels right" confirmation
 */
export default function RitualReveal({
  anchor,
  action,
  ritualStatement,
  whyItFits,
  recovery,
  onNext,
  onBack,
  onAdjust,
}: RitualRevealProps) {
  const emoji = getHabitEmoji(anchor, action);
  const heroStatement = ritualStatement ?? formatRitualStatement(anchor, action);

  // Take first 1-2 reasons
  const mainReason = whyItFits.slice(0, 2).join(', and ');

  return (
    <div className="reveal-screen">
      <button className="back-button" onClick={onBack}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="reveal-content">
        <div className="habit-emoji">{emoji}</div>

        <blockquote className="ritual-statement">
          &ldquo;{heroStatement}&rdquo;
        </blockquote>

        <p className="ritual-explanation">{mainReason}</p>

        <p className="recovery-note">If you miss: {recovery}</p>
      </div>

      <div className="reveal-footer">
        <Button onClick={onNext} variant="primary" size="lg" className="w-full">
          This feels right
        </Button>
        <button className="adjust-button" onClick={onAdjust}>
          Let me adjust
        </button>
      </div>

      <style jsx>{`
        .reveal-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 16px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: 14px;
          cursor: pointer;
          padding: 8px 0;
          margin-bottom: 24px;
        }

        .back-button:hover {
          opacity: 0.8;
        }

        .reveal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 24px 0;
        }

        .habit-emoji {
          font-size: 48px;
          margin-bottom: 24px;
        }

        .ritual-statement {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 24px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0 0 24px 0;
          max-width: 300px;
          padding: 0;
          border: none;
        }

        .ritual-explanation {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 16px 0;
          max-width: 320px;
        }

        .recovery-note {
          font-size: 13px;
          color: var(--text-tertiary);
          margin: 0;
          max-width: 300px;
        }

        .reveal-footer {
          padding: 16px 0;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
        }

        .adjust-button {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .adjust-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
