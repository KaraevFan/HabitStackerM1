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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {done ? "Data cleared. Redirecting..." : "Clearing data..."}
        </p>
      </div>
    </div>
  );
}
