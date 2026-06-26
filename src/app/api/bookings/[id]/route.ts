import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { updateBookingStatusSchema } from '@/lib/validations/booking';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingStatusChange } from '@/lib/notifications/events';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      services(*, service_categories(name_ar, name_en)),
      booking_images(*)
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.customer_id !== auth.user.id && data.technician_id !== auth.user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, updateBookingStatusSchema);
  if ('response' in parsed) return parsed.response;

  const { status } = parsed.data;

  const { data: existing } = await supabase
    .from('bookings')
    .select('customer_id, technician_id, services(name_ar)')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing && ['in_progress', 'completed', 'cancelled'].includes(status)) {
    await notifyBookingStatusChange(
      {
        bookingId: id,
        serviceName: (existing.services as { name_ar?: string } | null)?.name_ar,
        customerId: existing.customer_id,
        technicianId: existing.technician_id,
      },
      status as 'in_progress' | 'completed' | 'cancelled',
    );
  }

  return NextResponse.json(data);
}
