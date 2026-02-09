'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('habit-stacker-data');
      localStorage.removeItem('habit-stacker-data-backup');
      localStorage.removeItem('habit-stacker-backup-timestamp');
      localStorage.removeItem('habit-stacker-conversation');
    }
    await supabase.auth.signOut();
    router.push('/login');
  }

  return { signOut };
}
