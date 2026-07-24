'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { logout } from '@/lib/auth/logout';

/**
 * Defer work that touches the Supabase client so we never await auth/DB calls
 * inside onAuthStateChange (that deadlocks the browser client lock).
 */
function deferAuthWork(work: () => void | Promise<void>) {
  setTimeout(() => {
    void work();
  }, 0);
}

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      deferAuthWork(async () => {
        setLoading(true);

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setProfile(profileData ?? null);
        } else {
          reset();
        }

        setLoading(false);
        router.refresh();
      });
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await logout({ scope: 'local' });
  };

  return { user, profile, isLoading, signOut };
}
