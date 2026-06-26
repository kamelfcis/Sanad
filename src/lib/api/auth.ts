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
