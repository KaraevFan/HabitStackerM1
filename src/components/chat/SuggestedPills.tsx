'use client';

interface SuggestedPillsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export default function SuggestedPills({
  suggestions,
  onSelect,
  disabled = false,
}: SuggestedPillsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 pl-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-full text-sm font-medium
            border border-[var(--bg-tertiary)]
            bg-[var(--bg-secondary)]
            text-[var(--text-primary)]
            hover:bg-[var(--bg-tertiary)]
            hover:border-[var(--accent-primary)]
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
