'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadHabitData, updateHabitData } from '@/lib/store/habitStore';
import { HabitData, HabitSystem } from '@/types/habit';
import YourSystemScreen from '@/components/system/YourSystemScreen';

export default function SystemPage() {
  const router = useRouter();
  const [habitData, setHabitData] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadHabitData();
    setHabitData(data);
    setIsLoading(false);

    // Redirect if no habit system
    if (!data?.system) {
      router.push('/');
    }
  }, [router]);

  const handleUpdateSystem = (updates: Partial<HabitSystem>) => {
    if (!habitData?.system) return;

    const updatedSystem = { ...habitData.system, ...updates };
    const updatedData = updateHabitData({ system: updatedSystem });
    setHabitData(updatedData);
  };

  if (isLoading || !habitData?.system) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  return (
    <YourSystemScreen
      system={habitData.system}
      onUpdateSystem={handleUpdateSystem}
    />
  );
}
