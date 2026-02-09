'use client';

import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">
          We hit an unexpected error. Your data is safe.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="block text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
