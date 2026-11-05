import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';

export async function DELETE(
  _request: NextRequest,
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
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (profile.role === 'admin') {
    return NextResponse.json({ error: 'Cannot delete an admin user' }, { status: 403 });
  }

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'user_delete',
    entity_type: 'user',
    entity_id: id,
    metadata: { role: profile.role, email: profile.email, full_name: profile.full_name },
  });

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Service role is not configured' }, { status: 500 });
  }

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
