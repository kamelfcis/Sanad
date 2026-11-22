import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { parseJsonBody } from '@/lib/api/validate';
import { adminComplaintUpdateSchema } from '@/lib/validations/complaints';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const body = await parseJsonBody(request, adminComplaintUpdateSchema);
  if ('response' in body) return body.response;

  const { data, error } = await supabase
    .from('complaints')
    .update({
      status: body.data.status,
      admin_notes: body.data.admin_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', idParsed.data.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ complaint: data });
}
