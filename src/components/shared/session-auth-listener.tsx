'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  consumeLogoutSuccessToast,
  handleSessionExpired,
  isVoluntaryLogout,
  resetVoluntaryLogoutFlag,
} from '@/lib/auth/logout';
import { useAuthStore } from '@/store/auth-store';

/**
 * Defer work that touches the Supabase client so we never await auth/DB calls
 * inside onAuthStateChange (that deadlocks the browser client lock).
 */
function deferAuthWork(work: () => void | Promise<void>) {
  setTimeout(() => {
    void work();
  }, 0);
}

/**
 * Listens for auth state changes — handles silent token refresh and
 * session expiry without flashing error UI.
 */
export function SessionAuthListener() {
  const { setUser, setProfile, setLoading, setSessionResolved, reset } = useAuthStore();

  useEffect(() => {
    if (consumeLogoutSuccessToast()) {
      toast({ title: 'تم تسجيل الخروج بنجاح' });
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        resetVoluntaryLogoutFlag();
        setUser(session.user);
        deferAuthWork(async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData ?? null);
          setLoading(false);
          setSessionResolved(true);
        });
        return;
      }

      if (event === 'SIGNED_OUT') {
        if (isVoluntaryLogout()) {
          reset();
          resetVoluntaryLogoutFlag();
          return;
        }

        deferAuthWork(() => handleSessionExpired());
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, setSessionResolved, reset]);

  return null;
}
