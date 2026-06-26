import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { createPaymentSchema } from '@/lib/validations/payments';
import {
  notifyPaymentSubmitted,
} from '@/lib/notifications/events';
import { createServiceRoleClient } from '@/lib/supabase/admin';

const PAYMENT_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

async function getPaymentSettings(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('id', PAYMENT_SETTINGS_ID)
    .single();
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id: bookingId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customer_id, price_quote, status, services(name_ar, name_en)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.customer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  const settings = await getPaymentSettings(supabase);

  return NextResponse.json({
    payment,
    settings,
    booking: {
      id: booking.id,
      price_quote: booking.price_quote,
      status: booking.status,
      services: booking.services,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id: bookingId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, createPaymentSchema);
  if ('response' in parsed) return parsed.response;

  const { payment_method, screenshot_url, amount: requestedAmount } = parsed.data;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_id,
      price_quote,
      status,
      services(name_ar)
    `)
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.customer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const amount = requestedAmount ?? Number(booking.price_quote);
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Booking has no price quote. Contact support before paying.' },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from('payments')
    .select('id, status')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'Payment already approved for this booking' }, { status: 409 });
  }

  if (existing?.status === 'pending') {
    return NextResponse.json({ error: 'Payment is pending review' }, { status: 409 });
  }

  const paymentPayload = {
    booking_id: bookingId,
    customer_id: auth.user.id,
    amount,
    payment_method,
    screenshot_url,
    status: 'pending' as const,
    rejection_reason: null,
    verified_by: null,
    verified_at: null,
  };

  let payment;

  if (existing?.status === 'rejected') {
    const { data, error } = await supabase
      .from('payments')
      .update(paymentPayload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    payment = data;
  } else {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentPayload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    payment = data;
  }

  const auditClient = createServiceRoleClient();
  await auditClient.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'payment_created',
    entity_type: 'payment',
    entity_id: payment.id,
    metadata: {
      booking_id: bookingId,
      amount,
      payment_method,
      resubmission: Boolean(existing),
      actor: 'customer',
    },
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', auth.user.id)
    .single();

  await notifyPaymentSubmitted(
    {
      paymentId: payment.id,
      bookingId,
      amount,
      customerName: profile?.full_name ?? undefined,
      serviceName: (booking.services as { name_ar?: string } | null)?.name_ar,
    },
  );

  return NextResponse.json(payment, { status: existing ? 200 : 201 });
}
