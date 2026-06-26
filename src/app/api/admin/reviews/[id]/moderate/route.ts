import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { moderateReviewSchema } from '@/lib/validations/reviews';
import { adminEntityIdSchema } from '@/lib/validations/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
  }
  const { id: reviewId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, moderateReviewSchema);
  if ('response' in parsed) return parsed.response;

  const { action, note } = parsed.data;

  const updates: Record<string, unknown> = {
    is_hidden: action === 'hide',
    moderation_note: note ?? null,
  };

  if (action === 'hide') {
    updates.hidden_at = new Date().toISOString();
    updates.hidden_by = auth.user.id;
  } else {
    updates.hidden_at = null;
    updates.hidden_by = null;
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: `review_${action}`,
    entity_type: 'review',
    entity_id: reviewId,
    metadata: { note: note ?? null },
  });

  return NextResponse.json(data);
}
