'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface EditBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  description: string;
  initialValue: string;
  placeholder?: string;
}

export default function EditBottomSheet({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  initialValue,
  placeholder,
}: EditBottomSheetProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset value when opened
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, initialValue]);

  // Lock body scroll and handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay)] z-[var(--z-overlay)] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[var(--z-sheet)] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bg-[var(--bg-primary)] rounded-t-2xl shadow-lg safe-area-bottom">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-[var(--bg-tertiary)] rounded-full" />
          </div>

          <div className="px-6 pb-8">
            {/* Title */}
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {title}
            </h2>

            {/* Description */}
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {description}
            </p>

            {/* Input */}
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              rows={3}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 resize-none"
            />

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSave}
                disabled={!value.trim()}
                variant="primary"
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
