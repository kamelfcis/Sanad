import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { BOOKING_ASSIGNMENT_DETAIL_SELECT } from '@/lib/booking/select-fragments';
import { TECHNICIAN_ACTIVE_WORK_BOOKING_STATUSES } from '@/lib/validations/booking';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data, error } = await db
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(
        ${BOOKING_ASSIGNMENT_DETAIL_SELECT}
      )
    `)
    .eq('technician_id', auth.user.id)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    const { data: byBooking, error: bookingLookupError } = await db
      .from('booking_assignments')
      .select(`
        *,
        booking:bookings(
          ${BOOKING_ASSIGNMENT_DETAIL_SELECT}
        )
      `)
      .eq('technician_id', auth.user.id)
      .eq('booking_id', id)
      .in('status', ['accepted', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bookingLookupError) {
      return NextResponse.json({ error: bookingLookupError.message }, { status: 500 });
    }

    if (byBooking) return NextResponse.json(byBooking);

    // Jobs list links by booking id for active/completed tabs — load owned booking if needed.
    const { data: ownedBooking, error: ownedBookingError } = await db
      .from('bookings')
      .select(BOOKING_ASSIGNMENT_DETAIL_SELECT)
      .eq('id', id)
      .eq('technician_id', auth.user.id)
      .maybeSingle();

    if (ownedBookingError) {
      return NextResponse.json({ error: ownedBookingError.message }, { status: 500 });
    }

    if (!ownedBooking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const activeStatuses = [...TECHNICIAN_ACTIVE_WORK_BOOKING_STATUSES, 'completed', 'cancelled'];
    if (!(activeStatuses as readonly string[]).includes(ownedBooking.status)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: linkedAssignment } = await db
      .from('booking_assignments')
      .select('id, booking_id, technician_id, status, response_at, created_at')
      .eq('booking_id', id)
      .eq('technician_id', auth.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      id: linkedAssignment?.id ?? id,
      booking_id: ownedBooking.id,
      technician_id: auth.user.id,
      status: linkedAssignment?.status ?? 'accepted',
      response_at: linkedAssignment?.response_at ?? null,
      created_at: linkedAssignment?.created_at ?? ownedBooking.created_at,
      booking: ownedBooking,
    });
  }

  return NextResponse.json(data);
}
