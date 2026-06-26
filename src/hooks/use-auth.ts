'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { logout } from '@/lib/auth/logout';

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
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

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await logout({ scope: 'local' });
  };

  return { user, profile, isLoading, signOut };
}
