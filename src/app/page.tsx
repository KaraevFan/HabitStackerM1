"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadHabitData, needsRecovery } from "@/lib/store/habitStore";
import { HabitData } from "@/types/habit";
import PlanScreen from "@/components/runtime/PlanScreen";
import WelcomeScreen from "@/components/runtime/WelcomeScreen";

export default function Home() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // If in missed state, route to recovery
    if (needsRecovery()) {
      router.push("/recovery");
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  // If no habit set up yet, show welcome
  if (!habitData || habitData.state === "install") {
    return <WelcomeScreen />;
  }

  // If habit is designed or active, show plan screen
  return <PlanScreen habitData={habitData} />;
}
