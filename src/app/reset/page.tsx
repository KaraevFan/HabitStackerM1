"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetHabitData, exportHabitData } from "@/lib/store/habitStore";

export default function ResetPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  const handleExport = () => {
    const json = exportHabitData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-stacker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetHabitData();
    setConfirmed(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  if (confirmed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-lg text-[var(--text-secondary)]">Data cleared. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Reset Data
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          This will clear all your habit data and start fresh. Download a backup first if you want to keep your history.
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleExport}
            className="w-full py-3.5 rounded-full border border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium text-base hover:bg-[var(--accent-subtle)] transition-colors"
          >
            Download my data
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-full bg-[var(--error)] text-white font-medium text-base hover:opacity-90 transition-opacity"
          >
            Reset everything
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
