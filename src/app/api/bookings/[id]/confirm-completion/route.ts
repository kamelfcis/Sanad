import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingStatusChange } from '@/lib/notifications/events';

export async function POST(
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

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, customer_id, technician_id, services(name_ar)')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.customer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status !== 'awaiting_customer_confirmation') {
    return NextResponse.json(
      { error: 'Invalid status transition', current_status: booking.status },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('customer_id', auth.user.id)
    .eq('status', 'awaiting_customer_confirmation')
    .select(
      `
      *,
      services(name_ar, name_en, slug),
      booking_images(image_url)
    `,
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Booking could not be confirmed (status may have changed)' },
      { status: 409 },
    );
  }

  const serviceName = (booking.services as { name_ar?: string } | null)?.name_ar;
  await notifyBookingStatusChange(
    {
      bookingId,
      serviceName,
      customerId: booking.customer_id,
      technicianId: booking.technician_id,
    },
    'completed',
  );

  return NextResponse.json(data);
}
