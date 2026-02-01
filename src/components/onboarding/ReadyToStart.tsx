'use client';

import Button from '@/components/ui/Button';

interface ReadyToStartProps {
  onStartNow: () => void;
  onStartLater: () => void;
  onBack: () => void;
}

/**
 * Get timing-aware CTA text
 */
function getCTAText(): string {
  const hour = new Date().getHours();
  if (hour >= 17) {
    return 'Start first rep tonight';
  } else if (hour >= 12) {
    return 'Start first rep now';
  } else {
    return 'Start first rep today';
  }
}

/**
 * Screen 4: Ready to start
 * Final screen before first rep
 */
export default function ReadyToStart({
  onStartNow,
  onStartLater,
  onBack,
}: ReadyToStartProps) {
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
        <div className="icon-container">
          <span className="start-icon">🚀</span>
        </div>

        <h2 className="ready-title">Your first rep is simple</h2>

        <p className="ready-message">
          Just do it once. Don&apos;t worry about doing it perfectly.
        </p>

        <p className="ready-permission">
          Week 1 is about showing up, not optimizing.
        </p>
      </div>

      <div className="reveal-footer">
        <Button onClick={onStartNow} variant="primary" size="lg" className="w-full">
          {getCTAText()}
        </Button>
        <button className="later-button" onClick={onStartLater}>
          I&apos;ll start tomorrow
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

        .icon-container {
          margin-bottom: 24px;
        }

        .start-icon {
          font-size: 48px;
        }

        .ready-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 16px 0;
          max-width: 280px;
        }

        .ready-message {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 12px 0;
          max-width: 300px;
        }

        .ready-permission {
          font-size: 14px;
          color: var(--text-tertiary);
          margin: 0;
          max-width: 280px;
        }

        .reveal-footer {
          padding: 16px 0;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
        }

        .later-button {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .later-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
