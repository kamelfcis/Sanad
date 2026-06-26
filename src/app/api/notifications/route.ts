import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { getNotifications } from '@/lib/services/notification-service';
import { listNotificationsQuerySchema } from '@/lib/validations/notifications';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const query = parseSearchParams(request.nextUrl.searchParams, listNotificationsQuerySchema);
  if ('response' in query) return query.response;

  const { limit, offset, is_read, type, search } = query.data;

  const result = await getNotifications(auth.user.id, supabase, {
    limit,
    offset,
    isRead: is_read === 'all' ? 'all' : is_read === 'true',
    type,
    search,
  });

  return NextResponse.json(result);
}
