import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import {
  technicianBookingStatusSchema,
  TECHNICIAN_STATUS_PRECONDITION,
} from '@/lib/validations/booking';
import { notifyBookingStatusChange } from '@/lib/notifications/events';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/technician/bookings/[id]
 * Technician job lifecycle: accepted → in_progress ("Start Job") and
 * in_progress → completed ("Complete Job"). Only the assigned technician may
 * transition their own booking, and only from the required previous status.
 * Notifies the customer on each transition.
 */
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

  const parsed = await parseJsonBody(request, technicianBookingStatusSchema);
  if ('response' in parsed) return parsed.response;
  const target = parsed.data.status;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data: booking, error: fetchError } = await db
    .from('bookings')
    .select('id, status, customer_id, technician_id, services(name_ar)')
    .eq('id', id)
    .eq('technician_id', auth.user.id)
    .maybeSingle();

  if (fetchError) {
    logger.error('technician booking status: fetch failed', fetchError, { bookingId: id });
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const requiredPrev = TECHNICIAN_STATUS_PRECONDITION[target];
  if (booking.status !== requiredPrev) {
    return NextResponse.json(
      { error: `Cannot move booking from "${booking.status}" to "${target}"` },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await db
    .from('bookings')
    .update({ status: target, updated_at: now })
    .eq('id', id);

  if (updateError) {
    logger.error('technician booking status: update failed', updateError, {
      bookingId: id,
      target,
    });
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  try {
    await notifyBookingStatusChange(
      {
        bookingId: id,
        serviceName: (booking.services as { name_ar?: string } | null)?.name_ar,
        customerId: booking.customer_id,
        technicianId: booking.technician_id,
      },
      target,
    );
  } catch (e) {
    logger.error('technician booking status: notify failed', e instanceof Error ? e : undefined, {
      bookingId: id,
    });
  }

  return NextResponse.json({ success: true, status: target });
}
