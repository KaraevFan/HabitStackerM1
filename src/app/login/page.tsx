'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? 'error' : 'sent');
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            Habit Stacker
          </h1>
        </div>

        {status === 'sent' ? (
          <div className="space-y-3">
            <p className="text-[var(--text-primary)]">Check your email</p>
            <p className="text-sm text-[var(--text-secondary)]">
              We sent a sign-in link to <strong>{email}</strong>. It might take
              a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Enter your email to get started. We&apos;ll send you a link — no
              password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
            {status === 'error' && (
              <p className="text-sm text-[var(--error)]">
                Couldn&apos;t send the link. Check your email address and try
                again.
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending...' : 'Send me a link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
