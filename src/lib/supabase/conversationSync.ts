import { createClient } from '@/lib/supabase/client';
import {
  loadConversation,
  saveConversation,
  setConversationSaveHook,
  setConversationClearHook,
} from '@/lib/store/conversationStore';
import type { IntakeState } from '@/types/conversation';

let currentUserId: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

async function pushToSupabase(userId: string, data: IntakeState): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('conversation_state').upsert(
    {
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) console.error('[ConversationSync] Write failed:', error);
}

async function deleteFromSupabase(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('conversation_state').delete().eq('user_id', userId);
}

export async function initializeConversationSync(userId: string): Promise<void> {
  currentUserId = userId;

  const supabase = createClient();
  const { data } = await supabase
    .from('conversation_state')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data) {
    saveConversation(data.data as IntakeState);
  } else {
    const localData = loadConversation();
    if (localData) {
      await pushToSupabase(userId, localData);
    }
  }

  // Enable sync
  setConversationSaveHook((state: IntakeState) => {
    if (!currentUserId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pushToSupabase(currentUserId!, state);
    }, DEBOUNCE_MS);
  });

  setConversationClearHook(() => {
    if (currentUserId) deleteFromSupabase(currentUserId);
  });
}

export function disableConversationSync() {
  setConversationSaveHook(null);
  setConversationClearHook(null);
  currentUserId = null;
  if (debounceTimer) clearTimeout(debounceTimer);
}
