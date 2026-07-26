import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody, errorResponse } from '@/lib/api/validate';
import { adminBlockUserSchema, adminEntityIdSchema } from '@/lib/validations/admin';
import { moderationBlocker } from '@/lib/admin/moderation';

/** Supabase treats a ban this long as permanent; 'none' lifts it. */
const PERMANENT_BAN = '876000h';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) return errorResponse('Invalid user ID', 400);
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, adminBlockUserSchema);
  if ('response' in parsed) return parsed.response;
  const { blocked, reason } = parsed.data;

  // Only columns that predate migration 00032, so the guards below still
  // answer correctly if the migration has not been applied yet.
  const { data: target } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', id)
    .maybeSingle();

  if (!target) return errorResponse('ADMIN_USER_NOT_FOUND', 404);

  const blocker = moderationBlocker(target, auth.user.id);
  if (blocker) return errorResponse(blocker, 403);

  // Banning the auth user is what actually stops a login; without the service
  // role we would only be setting a flag the user could ignore.
  if (!isServiceRoleConfigured()) {
    return errorResponse('ADMIN_SERVICE_ROLE_REQUIRED', 503);
  }
  const serviceClient = createServiceRoleClient();

  // Auth is the source of truth for the ban, so read the current state from
  // there — it is what we restore to if the profile update below fails.
  const { data: existing } = await serviceClient.auth.admin.getUserById(id);
  const wasBanned = Boolean(
    (existing?.user as { banned_until?: string | null } | undefined)?.banned_until,
  );

  const { error: banError } = await serviceClient.auth.admin.updateUserById(id, {
    ban_duration: blocked ? PERMANENT_BAN : 'none',
  });
  if (banError) {
    return NextResponse.json(
      { error: 'ADMIN_BLOCK_USER_FAILED', detail: banError.message },
      { status: 500 },
    );
  }

  const { data: updated, error: updateError } = await serviceClient
    .from('profiles')
    .update({
      is_blocked: blocked,
      blocked_at: blocked ? new Date().toISOString() : null,
      blocked_reason: blocked ? (reason?.trim() || null) : null,
      blocked_by: blocked ? auth.user.id : null,
    })
    .eq('id', id)
    .select('id, full_name, email, role, is_blocked, blocked_at, blocked_reason, blocked_by')
    .single();

  if (updateError) {
    // The ban already landed; roll it back so auth and the profile agree.
    await serviceClient.auth.admin.updateUserById(id, {
      ban_duration: wasBanned ? PERMANENT_BAN : 'none',
    });
    return NextResponse.json(
      { error: 'ADMIN_BLOCK_USER_FAILED', detail: updateError.message },
      { status: 500 },
    );
  }

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: blocked ? 'user_block' : 'user_unblock',
    entity_type: 'profile',
    entity_id: id,
    metadata: {
      role: target.role,
      email: target.email,
      full_name: target.full_name,
      reason: blocked ? (reason?.trim() || null) : null,
    },
  });

  return NextResponse.json(updated);
}
