'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { initializeHabitSync, disableSync } from '@/lib/supabase/habitSync';
import {
  initializeConversationSync,
  disableConversationSync,
} from '@/lib/supabase/conversationSync';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

export function useAuthContext() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await initializeHabitSync(user.id);
        await initializeConversationSync(user.id);
      }
      setIsLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        disableSync();
        disableConversationSync();
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="size-8 border-2 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ user, isLoading }}>{children}</AuthCtx.Provider>
  );
}
