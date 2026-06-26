import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { paymentIdParamsSchema, rejectPaymentSchema } from '@/lib/validations/payments';
import { notifyPaymentRejected } from '@/lib/notifications/events';

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

  const parsed = await parseJsonBody(request, rejectPaymentSchema);
  if ('response' in parsed) return parsed.response;

  const { rejection_reason } = parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from('payments')
    .select(`
      *,
      booking:bookings!booking_id(
        id,
        customer_id,
        services(name_ar)
      )
    `)
    .eq('id', paymentId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending payments can be rejected' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      verified_by: auth.user.id,
      verified_at: now,
      rejection_reason,
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
    metadata: { booking_id: existing.booking_id, amount: existing.amount, rejection_reason },
  });

  const booking = existing.booking as {
    id: string;
    customer_id: string;
    services?: { name_ar?: string } | null;
  } | null;

  if (booking) {
    await notifyPaymentRejected(
      booking.customer_id,
      {
        paymentId,
        bookingId: booking.id,
        amount: Number(existing.amount),
        serviceName: booking.services?.name_ar,
      },
      rejection_reason,
    );
  }

  return NextResponse.json(data);
}
