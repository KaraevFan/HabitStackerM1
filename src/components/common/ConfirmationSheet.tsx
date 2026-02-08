'use client';

import { useEffect, useCallback } from 'react';

interface ConfirmationSheetProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  previousValue?: string;
  newValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Reusable bottom sheet for confirming system changes
 * Used by pattern actions and reflection "Accept and update"
 */
export default function ConfirmationSheet({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  previousValue,
  newValue,
  confirmLabel = 'Accept and update',
  cancelLabel = 'Not now',
}: ConfirmationSheetProps) {
  // Escape key handler
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel]
  );

  // Body scroll lock + escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center"
      onClick={onCancel}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[var(--overlay)]" />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[480px] rounded-t-2xl bg-[var(--bg-primary)] p-6 animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {description}
        </p>

        {/* Before/After comparison */}
        {previousValue && newValue && (
          <div className="mb-6 space-y-3">
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Current
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{previousValue}</p>
            </div>
            <div className="rounded-lg bg-[var(--accent-subtle)] p-3 border border-[var(--accent-primary)]">
              <p className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wide mb-1">
                New
              </p>
              <p className="text-sm text-[var(--text-primary)]">{newValue}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium text-base hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
