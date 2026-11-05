import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminEntityIdSchema } from '@/lib/validations/admin';

const blockSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  if (id === auth.user.id) {
    return NextResponse.json({ error: 'Cannot block your own account' }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, blockSchema);
  if ('response' in parsed) return parsed.response;

  const { blocked, reason } = parsed.data;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_blocked: blocked,
      blocked_at: blocked ? now : null,
      blocked_reason: blocked ? reason ?? null : null,
      blocked_by: blocked ? auth.user.id : null,
      updated_at: now,
    })
    .eq('id', id)
    .select('id, is_blocked')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: blocked ? 'user_block' : 'user_unblock',
    entity_type: 'user',
    entity_id: id,
    metadata: { reason: reason ?? null },
  });

  return NextResponse.json(data);
}
