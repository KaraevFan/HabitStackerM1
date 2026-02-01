'use client';

import Button from '@/components/ui/Button';

interface RecoveryOfferProps {
  recoveryAction: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Recovery action offer after logging a miss
 * The recovery action is the 30-second signal that keeps the pattern alive
 */
export default function RecoveryOffer({
  recoveryAction,
  onAccept,
  onDecline,
}: RecoveryOfferProps) {
  return (
    <div className="recovery-screen">
      <div className="recovery-content">
        <p className="recovery-label">Your recovery action:</p>

        <blockquote className="recovery-action">
          &ldquo;{recoveryAction}&rdquo;
        </blockquote>

        <p className="recovery-explanation">
          This isn&apos;t a replacement. It&apos;s a signal to your brain that
          you&apos;re still in the game.
        </p>
      </div>

      <div className="recovery-actions">
        <Button onClick={onAccept} variant="primary" size="lg" className="w-full">
          I&apos;ll do it now
        </Button>

        <button onClick={onDecline} className="decline-button">
          Not right now
        </button>
      </div>

      <style jsx>{`
        .recovery-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 24px;
        }

        .recovery-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .recovery-label {
          font-size: 14px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 16px 0;
        }

        .recovery-action {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 22px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0 0 24px 0;
          padding: 0;
          border: none;
          max-width: 300px;
        }

        .recovery-explanation {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
          max-width: 300px;
        }

        .recovery-actions {
          padding: 24px 0;
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
        }

        .decline-button {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .decline-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
