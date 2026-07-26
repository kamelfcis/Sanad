import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/api/validate';

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export async function requireAuth(
  supabase: SupabaseClient,
): Promise<{ user: User } | { response: NextResponse }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: errorResponse('Unauthorized', 401) };
  }

  // A blocked account is banned at the auth layer too, so its refresh token
  // dies within one token lifetime. This closes the window in between, and
  // covers the case where the ban landed but the profile update did not.
  //
  // `error` here means the column is missing (migration 00032 has not run yet);
  // the auth-level ban still holds, so let the request through rather than
  // locking out every API caller.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && profile?.is_blocked) {
    return { response: errorResponse('ACCOUNT_BLOCKED', 403) };
  }

  return { user };
}

export async function requireAdmin(
  supabase: SupabaseClient,
  user: User,
): Promise<{ role: 'admin' } | { response: NextResponse }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { response: errorResponse('Forbidden', 403) };
  }

  return { role: 'admin' };
}
