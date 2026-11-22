import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { parseJsonBody } from '@/lib/api/validate';
import { adminTechnicianContractorSchema } from '@/lib/validations/technicians';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid technician ID' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const body = await parseJsonBody(request, adminTechnicianContractorSchema);
  if ('response' in body) return body.response;

  const isContractor = body.data.provider_role === 'contractor';
  const { data, error } = await supabase
    .from('technician_profiles')
    .update({
      provider_role: body.data.provider_role,
      contractor_kind: isContractor ? body.data.contractor_kind ?? 'specialist' : 'specialist',
      capacity_tier: body.data.capacity_tier,
      team_size: isContractor ? body.data.team_size ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', idParsed.data.id)
    .select('provider_role, contractor_kind, capacity_tier, team_size')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contractor: data });
}
