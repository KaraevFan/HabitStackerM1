'use client';

import Link from 'next/link';

export function ContextScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Your habit designer
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          I&apos;ll ask you a few questions about what you want to work on,
          then design a tiny system that fits your life.
        </p>
        <p className="text-sm text-[var(--text-tertiary)]">
          Takes about 3 minutes. No wrong answers.
        </p>
        <Link
          href="/setup"
          className="inline-block w-full px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-hover)] text-center"
        >
          Let&apos;s get started
        </Link>
      </div>
    </div>
  );
}
