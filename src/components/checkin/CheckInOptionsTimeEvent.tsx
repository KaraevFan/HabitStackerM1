'use client';

interface CheckInOptionsTimeEventProps {
  habitAction: string;
  onCompleted: () => void;
  onMissed: () => void;
  onSkip: () => void;
}

/**
 * Two-option check-in for time/event-anchored habits
 * "Today's rep" with:
 * - Done (completed)
 * - Can't today (missed)
 */
export default function CheckInOptionsTimeEvent({
  habitAction,
  onCompleted,
  onMissed,
  onSkip,
}: CheckInOptionsTimeEventProps) {
  return (
    <div className="options-screen">
      <div className="options-content">
        <p className="options-label">TODAY&apos;S REP</p>

        <h1 className="options-title">Did you do it?</h1>

        <p className="options-action">{habitAction}</p>

        <div className="options-list">
          <button onClick={onCompleted} className="option-button primary">
            <span className="option-icon">✓</span>
            <div className="option-text">
              <span className="option-main">Done</span>
            </div>
          </button>

          <button onClick={onMissed} className="option-button">
            <span className="option-icon">✗</span>
            <div className="option-text">
              <span className="option-main">Can&apos;t today</span>
            </div>
          </button>
        </div>

        <button onClick={onSkip} className="skip-button">
          Skip for now
        </button>
      </div>

      <style jsx>{`
        .options-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 24px;
        }

        .options-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .options-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px 0;
        }

        .options-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 16px 0;
        }

        .options-action {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0 0 32px 0;
          max-width: 280px;
          line-height: 1.4;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 300px;
        }

        .option-button {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 16px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .option-button:hover {
          border-color: var(--accent-primary);
          background: var(--accent-subtle);
        }

        .option-button.primary {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .option-button.primary:hover {
          opacity: 0.9;
        }

        .option-button.primary .option-icon,
        .option-button.primary .option-main {
          color: white;
        }

        .option-icon {
          font-size: 20px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-main {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .skip-button {
          width: 100%;
          margin-top: 24px;
          padding: 12px;
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
