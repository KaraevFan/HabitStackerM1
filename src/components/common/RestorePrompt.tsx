'use client';

import { restoreFromBackup, clearBackup, getBackupTimestamp } from '@/lib/store/habitStore';

interface RestorePromptProps {
  onRestored: () => void;
  onDismissed: () => void;
}

/**
 * Shown when primary data was lost but backup exists.
 * Offers restore or fresh start.
 */
export default function RestorePrompt({ onRestored, onDismissed }: RestorePromptProps) {
  const timestamp = getBackupTimestamp();
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString()
    : 'recently';

  const handleRestore = () => {
    const restored = restoreFromBackup();
    if (restored) {
      onRestored();
    }
  };

  const handleFresh = () => {
    clearBackup();
    onDismissed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="max-w-sm w-full rounded-2xl bg-[var(--bg-primary)] p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center">
          Data was reset
        </h2>
        <p className="text-sm text-[var(--text-secondary)] text-center">
          It looks like your data was cleared. We have a backup from {formattedTime}.
          Would you like to restore it?
        </p>
        <div className="space-y-2 pt-2">
          <button
            onClick={handleRestore}
            className="w-full py-3.5 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 transition-opacity"
          >
            Restore my data
          </button>
          <button
            onClick={handleFresh}
            className="w-full py-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}
