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

    const applySession = async (session: Session | null) => {
      setUser(session?.user ?? null);

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
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // INITIAL_SESSION is the sole hydration path — do not call getSession() in parallel
      // (that deadlocks with this listener in @supabase/ssr browser clients).
      if (event === 'INITIAL_SESSION') {
        await applySession(session);
        return;
      }

      if (event === 'SIGNED_IN') {
        await applySession(session);
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
