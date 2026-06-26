import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AuthProfile } from '@/store/auth-store';
import type { User } from '@supabase/supabase-js';

export async function getServerAuthSession(): Promise<{
  user: User | null;
  profile: AuthProfile | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile: profile ?? null };
}
