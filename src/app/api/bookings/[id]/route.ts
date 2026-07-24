import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import {
  cancelBookingSchema,
  isCustomerCancellableStatus,
} from '@/lib/validations/booking';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingCancelledByCustomer } from '@/lib/notifications/events';

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
      services(name_ar, name_en, slug),
      booking_images(image_url)
    `,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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

/**
 * Customer cancel only. Admin status changes use /api/admin/bookings/[id]/status.
 * Allowed previous statuses: pending | matched | accepted.
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

  const parsed = await parseJsonBody(request, cancelBookingSchema);
  if ('response' in parsed) return parsed.response;

  const { reason } = parsed.data;
  const now = new Date().toISOString();
  const writeClient = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data: existing, error: fetchError } = await writeClient
    .from('bookings')
    .select('id, status, customer_id, technician_id, services(name_ar)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (existing.customer_id !== auth.user.id) {
    return NextResponse.json(
      { error: 'Only the booking owner can cancel this request' },
      { status: 403 },
    );
  }

  if (existing.status === 'cancelled') {
    return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 409 });
  }

  if (!isCustomerCancellableStatus(existing.status)) {
    return NextResponse.json(
      {
        error:
          'Cannot cancel a booking that is in progress, completed, or otherwise finalized',
        current_status: existing.status,
      },
      { status: 409 },
    );
  }

  const { data: assignmentRows } = await writeClient
    .from('booking_assignments')
    .select('technician_id, status')
    .eq('booking_id', id)
    .in('status', ['pending', 'accepted']);

  const { data, error } = await writeClient
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason?.trim() || null,
      updated_at: now,
    })
    .eq('id', id)
    .eq('customer_id', auth.user.id)
    .in('status', ['pending', 'matched', 'accepted'])
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
      { error: 'Booking could not be cancelled (status may have changed)' },
      { status: 409 },
    );
  }

  await writeClient
    .from('booking_assignments')
    .update({ status: 'cancelled', response_at: now })
    .eq('booking_id', id)
    .in('status', ['pending', 'accepted']);

  const technicianIds = [
    ...(existing.technician_id ? [existing.technician_id] : []),
    ...(assignmentRows ?? []).map((row) => row.technician_id),
  ];

  const hadAssignedOrMatchedTech = technicianIds.length > 0;
  const needsAdminNotice =
    !hadAssignedOrMatchedTech &&
    (existing.status === 'pending' || existing.status === 'matched');

  const serviceName = (existing.services as { name_ar?: string } | null)?.name_ar;

  await notifyBookingCancelledByCustomer(
    {
      bookingId: id,
      serviceName,
      customerId: existing.customer_id,
      technicianId: existing.technician_id,
    },
    {
      technicianIds,
      notifyAdmins: needsAdminNotice,
      reason,
    },
  );

  return NextResponse.json(data);
}
