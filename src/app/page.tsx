"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadHabitData } from "@/lib/store/habitStore";
import { HabitData } from "@/types/habit";
import { getUserState, getRouteForState } from "@/hooks/useUserState";
import PlanScreen from "@/components/runtime/PlanScreen";
import WelcomeScreen from "@/components/runtime/WelcomeScreen";

/**
 * Home page with state-based routing
 *
 * Routes to different experiences based on user lifecycle:
 * - new_user → Landing page (WelcomeScreen)
 * - mid_conversation → Redirect to /setup
 * - system_designed → PlanScreen with "Ready to start" prompt
 * - missed_yesterday → Redirect to /recovery
 * - active_today / completed_today / needs_tuneup → PlanScreen
 */
export default function Home() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Determine user state and route accordingly
    const userState = getUserState(data);

    // Handle redirects for states that need different pages
    if (userState === 'mid_conversation') {
      router.push('/setup');
      return;
    }

    if (userState === 'missed_yesterday') {
      router.push('/recovery');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - router is stable

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text-tertiary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine what to show based on user state
  const userState = getUserState(habitData);

  // New user → Welcome screen
  if (userState === 'new_user') {
    return <WelcomeScreen />;
  }

  // All other states that stay on home → PlanScreen
  // (mid_conversation and missed_yesterday already redirected above)
  if (habitData) {
    return <PlanScreen habitData={habitData} />;
  }

  // Fallback to welcome screen
  return <WelcomeScreen />;
}
