'use client';

import Button from '@/components/ui/Button';

interface IdentityRevealProps {
  identity: string;
  identityBehaviors: string[];
  onNext: () => void;
  onBack: () => void;
}

/**
 * Screen 1: Identity reveal
 * Shows who the user is becoming
 */
export default function IdentityReveal({
  identity,
  identityBehaviors,
  onNext,
  onBack,
}: IdentityRevealProps) {
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
        <p className="reveal-label">You&apos;re becoming</p>

        <h1 className="identity-statement">{identity}</h1>

        {identityBehaviors && identityBehaviors.length > 0 && (
          <div className="identity-behaviors">
            <p className="behaviors-intro">People with this identity typically:</p>
            <ul className="behaviors-list">
              {identityBehaviors.map((behavior, i) => (
                <li key={i}>{behavior}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="reveal-footer">
        <Button onClick={onNext} variant="primary" size="lg" className="w-full">
          Next
        </Button>
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

        .reveal-label {
          font-size: 14px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .identity-statement {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.3;
          margin: 0 0 32px 0;
          max-width: 320px;
        }

        .identity-behaviors {
          max-width: 320px;
        }

        .behaviors-intro {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .behaviors-list {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: left;
        }

        .behaviors-list li {
          font-size: 14px;
          color: var(--text-secondary);
          padding: 8px 0;
          border-bottom: 1px solid var(--bg-tertiary);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .behaviors-list li:last-child {
          border-bottom: none;
        }

        .behaviors-list li::before {
          content: '•';
          color: var(--accent-primary);
          font-weight: bold;
        }

        .reveal-footer {
          padding: 16px 0;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
