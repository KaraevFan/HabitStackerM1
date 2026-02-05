"use client";

import { useEffect, useState } from "react";
import { resetHabitData } from "@/lib/store/habitStore";

export default function ResetPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    resetHabitData();
    setDone(true);
    // Redirect after brief delay
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <p className="text-lg text-[var(--text-secondary)]">
          {done ? "Data cleared. Redirecting..." : "Clearing data..."}
        </p>
      </div>
    </div>
  );
}
