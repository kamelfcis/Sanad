import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { getUnreadCount } from '@/lib/services/notification-service';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const count = await getUnreadCount(auth.user.id, supabase);

  return NextResponse.json({ count });
}
