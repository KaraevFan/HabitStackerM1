'use client';

interface WhatsNextScreenProps {
  onStartNew: () => void;
  onGoHome: () => void;
}

export default function WhatsNextScreen({
  onStartNew,
  onGoHome,
}: WhatsNextScreenProps) {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🌱</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
          What&apos;s next?
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Your habit has graduated. You&apos;ve proven you can build a behavior into your life. Ready to do it again?
        </p>

        <div className="space-y-3">
          <button
            onClick={onStartNew}
            className="w-full py-4 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Start a New Habit
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
