"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function WelcomeScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          Habit Stacker
        </h1>
        <p className="max-w-md text-lg text-[var(--text-secondary)]">
          Design one small habit system that survives bad days.
        </p>
        <Link href="/setup">
          <Button size="lg">Start Consult</Button>
        </Link>
      </main>
    </div>
  );
}
