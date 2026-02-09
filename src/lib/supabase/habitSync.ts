import { createClient } from '@/lib/supabase/client';
import { loadHabitData, saveHabitData, setOnSaveHook } from '@/lib/store/habitStore';
import type { HabitData } from '@/types/habit';

let currentUserId: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

async function pushToSupabase(userId: string, data: HabitData): Promise<void> {
  const supabase = createClient();
  const { _needsRestoreConfirmation, ...cleanData } = data as HabitData & {
    _needsRestoreConfirmation?: boolean;
  };

  const { error } = await supabase.from('habit_data').upsert(
    {
      user_id: userId,
      data: cleanData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('[HabitSync] Supabase write failed:', error);
  }
}

/**
 * Pull from Supabase → hydrate localStorage → enable sync.
 * Called once after auth on app init.
 */
export async function initializeHabitSync(userId: string): Promise<HabitData> {
  currentUserId = userId;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('habit_data')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data && !error) {
    // Cloud data exists — hydrate localStorage
    saveHabitData(data.data as HabitData);
    enableSync();
    return data.data as HabitData;
  }

  // No cloud data — check if local data should be pushed up
  const localData = loadHabitData();
  if (localData.state !== 'install') {
    await pushToSupabase(userId, localData);
  }

  enableSync();
  return localData;
}

function enableSync() {
  setOnSaveHook((data: HabitData) => {
    if (!currentUserId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pushToSupabase(currentUserId!, data);
    }, DEBOUNCE_MS);
  });
}

export function disableSync() {
  setOnSaveHook(null);
  currentUserId = null;
  if (debounceTimer) clearTimeout(debounceTimer);
}
