import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminTechnicianStatusSchema } from '@/lib/validations/technicians';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyTechnicianStatusChange } from '@/lib/notifications/events';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid technician ID' }, { status: 400 });
  }
  const { id: technicianId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, adminTechnicianStatusSchema);
  if ('response' in parsed) return parsed.response;

  const { action, reason } = parsed.data;

  const statusMap: Record<string, string> = {
    approve: 'verified',
    reject: 'rejected',
    suspend: 'rejected',
    reactivate: 'verified',
  };

  const newStatus = statusMap[action];

  const { data: tech } = await supabase
    .from('technician_profiles')
    .select('verification_status')
    .eq('id', technicianId)
    .single();

  if (!tech) return NextResponse.json({ error: 'Technician not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('technician_profiles')
    .update({ verification_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', technicianId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: `technician_${action}`,
    entity_type: 'technician',
    entity_id: technicianId,
    metadata: { from: tech.verification_status, to: newStatus, reason: reason ?? null },
  });

  await notifyTechnicianStatusChange(
    technicianId,
    action as 'approve' | 'reject' | 'suspend' | 'reactivate',
    reason ?? undefined,
  );

  return NextResponse.json(data);
}
