'use client';

interface CoachIntentSheetProps {
  onSelectIntent: (intent: string) => void;
  onCancel: () => void;
}

const INTENTS = [
  {
    id: 'easier',
    label: 'Make habit easier',
    description: "It's too hard to do consistently",
  },
  {
    id: 'harder',
    label: 'Make it harder',
    description: "It's become too easy, I want to level up",
  },
  {
    id: 'wrong_habit',
    label: "Not sure it's the right habit",
    description: 'I want to reconsider my approach',
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'I just want to talk it through',
  },
];

/**
 * Intent selection before on-demand coach conversation
 */
export default function CoachIntentSheet({
  onSelectIntent,
  onCancel,
}: CoachIntentSheetProps) {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] px-6 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
          What&apos;s on your mind?
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          This helps me focus the conversation.
        </p>

        <div className="space-y-3 mb-8">
          {INTENTS.map((intent) => (
            <button
              key={intent.id}
              onClick={() => onSelectIntent(intent.label)}
              className="w-full p-4 rounded-xl text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <p className="font-medium text-[var(--text-primary)]">{intent.label}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{intent.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
