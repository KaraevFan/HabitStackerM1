'use client';

import { useState } from 'react';

interface DifficultyRatingProps {
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => void;
  onSkip: () => void;
}

const RATINGS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: '😫', label: 'Hard' },
  { value: 2, emoji: '😕', label: '' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: '' },
  { value: 5, emoji: '😊', label: 'Easy' },
];

/**
 * Optional difficulty rating after logging a rep
 */
export default function DifficultyRating({ onRate, onSkip }: DifficultyRatingProps) {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const handleSelect = (rating: 1 | 2 | 3 | 4 | 5) => {
    setSelected(rating);
    // Brief delay so user sees selection
    setTimeout(() => onRate(rating), 150);
  };

  return (
    <div className="difficulty-rating">
      <p className="rating-prompt">How did it feel today? <span className="optional">(optional)</span></p>

      <div className="rating-options">
        {RATINGS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            className={`rating-button ${selected === value ? 'selected' : ''}`}
            aria-label={`Rate difficulty ${value} out of 5`}
          >
            <span className="rating-emoji">{emoji}</span>
            {label && <span className="rating-label">{label}</span>}
          </button>
        ))}
      </div>

      <button onClick={onSkip} className="skip-button">
        Skip
      </button>

      <style jsx>{`
        .difficulty-rating {
          text-align: center;
        }

        .rating-prompt {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
        }

        .optional {
          color: var(--text-tertiary);
        }

        .rating-options {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .rating-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 56px;
        }

        .rating-button:hover {
          border-color: var(--accent-primary);
        }

        .rating-button.selected {
          background: var(--accent-subtle);
          border-color: var(--accent-primary);
        }

        .rating-emoji {
          font-size: 24px;
        }

        .rating-label {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .skip-button {
          background: none;
          border: none;
          font-size: 14px;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 8px 16px;
        }

        .skip-button:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
