'use client';

interface CheckInOptionsProps {
  habitAction: string; // The action part of the habit (for display)
  onNoTrigger: () => void;
  onCompleted: () => void;
  onMissed: () => void;
  onSkip: () => void;
}

/**
 * Three-option check-in for reactive habits
 * "How was last night?" with:
 * - Slept through (no trigger)
 * - Used the protocol (completed)
 * - Stayed in bed (missed)
 */
export default function CheckInOptions({
  habitAction,
  onNoTrigger,
  onCompleted,
  onMissed,
  onSkip,
}: CheckInOptionsProps) {
  return (
    <div className="options-screen">
      <div className="options-content">
        <p className="options-label">MORNING CHECK-IN</p>

        <h1 className="options-title">How was last night?</h1>

        <div className="options-list">
          <button onClick={onNoTrigger} className="option-button">
            <span className="option-icon">🌙</span>
            <div className="option-text">
              <span className="option-main">Slept through the night</span>
              <span className="option-sub">No waking, no action needed</span>
            </div>
          </button>

          <button onClick={onCompleted} className="option-button">
            <span className="option-icon">✓</span>
            <div className="option-text">
              <span className="option-main">Woke up and used the protocol</span>
              <span className="option-sub">{habitAction}</span>
            </div>
          </button>

          <button onClick={onMissed} className="option-button">
            <span className="option-icon">✗</span>
            <div className="option-text">
              <span className="option-main">Woke up but stayed in bed</span>
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
          margin: 0 0 32px 0;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-button {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
          padding: 16px;
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
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .option-sub {
          font-size: 13px;
          color: var(--text-secondary);
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
