import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { deleteNotifications } from '@/lib/services/notification-service';
import { bulkNotificationIdsSchema } from '@/lib/validations/notifications';

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, bulkNotificationIdsSchema);
  if ('response' in parsed) return parsed.response;

  const deleted = await deleteNotifications(parsed.data.ids, auth.user.id, supabase);

  return NextResponse.json({ success: true, deleted });
}
