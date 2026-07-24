'use client';

import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { resetVoluntaryLogoutFlag, clearLogoutTransition } from '@/lib/auth/logout';
import { useAuthStore } from '@/store/auth-store';

async function fetchProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

/**
 * Defer work that touches the Supabase client so we never await auth/DB calls
 * inside onAuthStateChange (that deadlocks the browser client lock).
 */
function deferAuthWork(work: () => void | Promise<void>) {
  setTimeout(() => {
    void work();
  }, 0);
}

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setSessionResolved } = useAuthStore();

  useEffect(() => {
    clearLogoutTransition();

    // Server bootstrap (AuthBootstrap) may have already hydrated the store.
    if (useAuthStore.getState().sessionResolved) {
      return;
    }

    const supabase = createClient();
    let mounted = true;

    const applySession = (session: Session | null) => {
      setUser(session?.user ?? null);

      deferAuthWork(async () => {
        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setProfile(profile);
        } else {
          setProfile(null);
          resetVoluntaryLogoutFlag();
        }

        if (mounted) {
          setLoading(false);
          setSessionResolved(true);
        }
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // INITIAL_SESSION is the sole hydration path — do not call getSession() in parallel
      // (that deadlocks with this listener in @supabase/ssr browser clients).
      if (event === 'INITIAL_SESSION') {
        applySession(session);
        return;
      }

      if (event === 'SIGNED_IN') {
        applySession(session);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        setSessionResolved(true);
        resetVoluntaryLogoutFlag();
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
