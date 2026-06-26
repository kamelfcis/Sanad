import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { BOOKING_ASSIGNMENT_DETAIL_SELECT } from '@/lib/booking/select-fragments';

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

    if (!byBooking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(byBooking);
  }

  return NextResponse.json(data);
}
