'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { loadHabitData, getRecentCheckIns } from '@/lib/store/habitStore';
import { getUserState } from '@/hooks/useUserState';
import type { FeedbackContext } from '@/types/feedback';

type Status = 'closed' | 'open' | 'sending' | 'sent';

function collectContext(pathname: string): FeedbackContext {
  const habitData = loadHabitData();
  const recent = getRecentCheckIns(7);

  return {
    currentScreen: pathname,
    habitState: habitData.state,
    repsCount: habitData.repsCount,
    lastCheckInDate: habitData.lastDoneDate || null,
    recentCheckIns: recent.map((c) => ({
      date: c.date,
      actionTaken: c.actionTaken,
      triggerOccurred: c.triggerOccurred,
    })),
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

export function FeedbackWidget() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>('closed');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'open') setStatus('closed');
    },
    [status],
  );

  useEffect(() => {
    if (status === 'open') {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [status, handleEscape]);

  // Auto-close after sent
  useEffect(() => {
    if (status !== 'sent') return;
    const timer = setTimeout(() => {
      setStatus('closed');
      setMessage('');
    }, 2000);
    return () => clearTimeout(timer);
  }, [status]);

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          context: collectContext(pathname),
        }),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('open');
      }
    } catch {
      setStatus('open');
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {status === 'closed' && (
        <button
          onClick={() => setStatus('open')}
          aria-label="Send feedback"
          className="fixed bottom-6 right-6 z-[var(--z-modal)] w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-sm flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-primary)] transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Sheet overlay + panel */}
      {status !== 'closed' && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center"
          onClick={() => status === 'open' && setStatus('closed')}
        >
          <div className="absolute inset-0 bg-[var(--overlay)]" />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            className="relative w-full max-w-[480px] rounded-t-2xl bg-[var(--bg-primary)] p-6 animate-slide-up safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {status === 'sent' ? (
              <div className="text-center py-4">
                <p className="text-[var(--text-primary)] font-medium">
                  Thanks for the feedback!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-[var(--text-primary)] font-medium text-sm">
                  How&apos;s it going?
                </p>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's working? What's weird? Anything..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || status === 'sending'}
                  className="w-full px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60 text-sm"
                >
                  {status === 'sending' ? 'Sending...' : 'Send feedback'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('closed')}
                  className="w-full text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
