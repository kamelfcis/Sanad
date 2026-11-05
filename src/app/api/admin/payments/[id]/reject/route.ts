import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { paymentIdParamsSchema } from '@/lib/validations/payments';
import { z } from 'zod';

const rejectBodySchema = z.object({
  rejection_reason: z.string().min(3).max(500),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = paymentIdParamsSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
  }
  const { id: paymentId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, rejectBodySchema);
  if ('response' in parsed) return parsed.response;

  const { data: existing, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending payments can be rejected' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      verified_by: auth.user.id,
      verified_at: new Date().toISOString(),
      rejection_reason: parsed.data.rejection_reason,
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'payment_rejected',
    entity_type: 'payment',
    entity_id: paymentId,
    metadata: { reason: parsed.data.rejection_reason },
  });

  return NextResponse.json(data);
}
