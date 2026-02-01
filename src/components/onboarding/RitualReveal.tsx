'use client';

import Button from '@/components/ui/Button';
import { getHabitEmoji } from '@/types/habit';

interface RitualRevealProps {
  anchor: string;
  action: string;
  whyItFits: string[];
  recovery: string;
  onNext: () => void;
  onBack: () => void;
  onAdjust: () => void;
}

/**
 * Generate hero statement from anchor and action
 * Handles both action anchors ("I brush my teeth") and event anchors ("my alarm goes off")
 */
function generateHeroStatement(anchor: string, action: string): string {
  let cleanAnchor = anchor
    .replace(/^(after|when)\s+/i, '')
    .replace(/^(tonight|today|tomorrow|this evening|this morning)\s+/i, '')
    .replace(/^(after|when)\s+/i, '')
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();

  // Detect if anchor is a noun phrase (alarm, notification, event) vs action phrase
  const isNounPhrase = /^(\d|my\s|the\s)|alarm|notification|reminder|timer|bell/i.test(cleanAnchor) &&
    !/^(I|my)\s+(get|sit|wake|stand|finish|start|leave|arrive|come|go)/i.test(cleanAnchor);

  if (isNounPhrase) {
    if (!/^(my|the)\s/i.test(cleanAnchor)) {
      cleanAnchor = `my ${cleanAnchor}`;
    }
    if (/alarm|notification|reminder|timer|bell/i.test(cleanAnchor) && !/\b(goes|rings|sounds|fires)\b/i.test(cleanAnchor)) {
      cleanAnchor = `${cleanAnchor} goes off`;
    }
  } else {
    if (!/^I\s/i.test(cleanAnchor)) {
      cleanAnchor = `I ${cleanAnchor.charAt(0).toLowerCase()}${cleanAnchor.slice(1)}`;
    }
  }

  let cleanAction = action
    .replace(/\byou\b/gi, 'I')
    .replace(/\byour\b/gi, 'my')
    .trim();
  cleanAction = cleanAction.charAt(0).toLowerCase() + cleanAction.slice(1);

  return `When ${cleanAnchor}, I ${cleanAction}.`;
}

/**
 * Screen 2: Ritual reveal
 * Shows the habit system with "This feels right" confirmation
 */
export default function RitualReveal({
  anchor,
  action,
  whyItFits,
  recovery,
  onNext,
  onBack,
  onAdjust,
}: RitualRevealProps) {
  const emoji = getHabitEmoji(anchor, action);
  const heroStatement = generateHeroStatement(anchor, action);

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
