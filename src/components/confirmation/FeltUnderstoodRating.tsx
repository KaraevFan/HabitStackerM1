'use client';

import { useState } from 'react';

interface FeltUnderstoodRatingProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
}

export default function FeltUnderstoodRating({
  onRate,
  disabled = false,
}: FeltUnderstoodRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSelect = (rating: number) => {
    if (disabled) return;
    setSelectedRating(rating);
    onRate(rating);
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-[var(--text-secondary)] text-center mb-4">
        How well did I understand your situation?
      </p>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleSelect(rating)}
            disabled={disabled}
            className={`
              w-12 h-12 rounded-lg text-lg font-medium
              transition-all duration-150
              ${
                selectedRating === rating
                  ? 'bg-[var(--accent-primary)] text-white scale-110'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={`Rate ${rating} out of 5`}
          >
            {rating}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2 px-1">
        <span>Not at all</span>
        <span>Completely</span>
      </div>
    </div>
  );
}
