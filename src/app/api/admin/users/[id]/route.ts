import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { errorResponse } from '@/lib/api/validate';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { moderationBlocker } from '@/lib/admin/moderation';

/**
 * Deletes a technician or customer.
 *
 * `profiles.id` references `auth.users(id) ON DELETE CASCADE`, so removing the
 * auth user is what tears down the profile and everything hanging off it:
 * technician_profiles, technician_skills, notifications, push_subscriptions,
 * chat_messages, reviews, booking_assignments, and — for a customer — their own
 * bookings. A technician's past bookings survive with a null technician_id
 * (see migration 00032).
 */
export async function DELETE(
  _request: NextRequest,
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

  const { data: target } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', id)
    .maybeSingle();

  if (!target) return errorResponse('ADMIN_USER_NOT_FOUND', 404);

  const blocker = moderationBlocker(target, auth.user.id);
  if (blocker) return errorResponse(blocker, 403);

  if (!isServiceRoleConfigured()) {
    return errorResponse('ADMIN_SERVICE_ROLE_REQUIRED', 503);
  }
  const serviceClient = createServiceRoleClient();

  // Logged before the delete: audit_logs.admin_id points at the acting admin,
  // not the victim, so the row outlives its subject.
  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'user_delete',
    entity_type: 'profile',
    entity_id: id,
    metadata: {
      role: target.role,
      email: target.email,
      full_name: target.full_name,
    },
  });

  const { error } = await serviceClient.auth.admin.deleteUser(id);

  if (error) {
    // 23503 = a foreign key still points at this profile with no delete rule.
    // Name it instead of collapsing into a generic 500 — the fix is a migration.
    const isForeignKey =
      error.message.includes('23503') ||
      error.message.toLowerCase().includes('foreign key') ||
      error.message.toLowerCase().includes('still referenced');

    if (isForeignKey) {
      return NextResponse.json(
        { error: 'ADMIN_DELETE_USER_BLOCKED_BY_FK', detail: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'ADMIN_DELETE_USER_FAILED', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ id, deleted: true });
}
