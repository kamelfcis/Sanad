import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { markAllAsRead } from '@/lib/services/notification-service';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const updated = await markAllAsRead(auth.user.id, supabase);

  return NextResponse.json({ success: true, updated });
}
