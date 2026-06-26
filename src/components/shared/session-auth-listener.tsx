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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        resetVoluntaryLogoutFlag();
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData ?? null);
        setLoading(false);
        setSessionResolved(true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        if (isVoluntaryLogout()) {
          reset();
          resetVoluntaryLogoutFlag();
          return;
        }

        await handleSessionExpired();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, setSessionResolved, reset]);

  return null;
}
