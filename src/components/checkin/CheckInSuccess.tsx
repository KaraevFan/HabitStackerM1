'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import DifficultyRating from './DifficultyRating';
import { Whisper } from '@/lib/education/whispers';

interface CheckInSuccessProps {
  title: string;
  subtitle: string;
  whisper?: Whisper | null;
  showDifficultyRating?: boolean;
  showOutcomeQuestion?: boolean; // For reactive habits: "Did it help?"
  onDifficultyRate?: (rating: 1 | 2 | 3 | 4 | 5) => void;
  onOutcomeResponse?: (success: boolean) => void;
  onDone: () => void;
}

/**
 * Success screen after logging a check-in
 * Shows encouragement, optional whisper, and optional difficulty rating
 */
export default function CheckInSuccess({
  title,
  subtitle,
  whisper,
  showDifficultyRating = true,
  showOutcomeQuestion = false,
  onDifficultyRate,
  onOutcomeResponse,
  onDone,
}: CheckInSuccessProps) {
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const handleRatingComplete = (rating: 1 | 2 | 3 | 4 | 5) => {
    onDifficultyRate?.(rating);
    setRatingDone(true);
    setTimeout(onDone, 300);
  };

  const handleRatingSkip = () => {
    setRatingDone(true);
    onDone();
  };

  const handleContinue = () => {
    if (showDifficultyRating && !ratingDone) {
      setShowRating(true);
    } else {
      onDone();
    }
  };

  const handleOutcome = (success: boolean) => {
    onOutcomeResponse?.(success);
    handleContinue();
  };

  return (
    <div className="success-screen">
      <div className="success-content">
        <div className="success-icon">✓</div>

        <h1 className="success-title">{title}</h1>
        <p className="success-subtitle">{subtitle}</p>

        {whisper && (
          <div className="whisper-card">
            <p className="whisper-content">{whisper.content}</p>
          </div>
        )}
      </div>

      <div className="success-actions">
        {showOutcomeQuestion && !showRating && (
          <div className="outcome-question">
            <p className="outcome-prompt">Did it help you fall back asleep?</p>
            <div className="outcome-options">
              <button
                onClick={() => handleOutcome(true)}
                className="outcome-button"
              >
                Yes, it did
              </button>
              <button
                onClick={() => handleOutcome(false)}
                className="outcome-button"
              >
                Not this time
              </button>
              <button
                onClick={handleContinue}
                className="outcome-skip"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {showRating && !ratingDone && (
          <DifficultyRating
            onRate={handleRatingComplete}
            onSkip={handleRatingSkip}
          />
        )}

        {!showRating && !showOutcomeQuestion && (
          <Button onClick={handleContinue} variant="primary" size="lg" className="w-full">
            Continue
          </Button>
        )}
      </div>

      <style jsx>{`
        .success-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 24px;
        }

        .success-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: white;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .success-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .success-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0 0 24px 0;
          max-width: 280px;
        }

        .whisper-card {
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          padding: 16px 20px;
          max-width: 320px;
        }

        .whisper-content {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .success-actions {
          padding: 24px 0;
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
        }

        .outcome-question {
          text-align: center;
        }

        .outcome-prompt {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
        }

        .outcome-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .outcome-button {
          padding: 12px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 20px;
          font-size: 14px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .outcome-button:hover {
          border-color: var(--accent-primary);
        }

        .outcome-skip {
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
