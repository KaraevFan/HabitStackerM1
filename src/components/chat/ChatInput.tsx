'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  initialValue = '',
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update value when initialValue changes (for pill selection)
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      // Focus and move cursor to end
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(initialValue.length, initialValue.length);
      }
    }
  }, [initialValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-[var(--bg-tertiary)] bg-[var(--bg-primary)] safe-area-bottom">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={`
          flex-1 resize-none rounded-3xl
          px-5 py-3 min-h-[48px]
          bg-[var(--bg-secondary)]
          text-[var(--text-primary)]
          placeholder-[var(--text-tertiary)]
          border border-[var(--bg-tertiary)]
          focus:outline-none focus:border-[var(--accent-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          text-base
        `}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={`
          p-3 rounded-xl min-h-[48px] min-w-[48px]
          bg-[var(--accent-primary)]
          text-white
          hover:bg-[var(--accent-hover)]
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
}
