import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingStatusChange } from '@/lib/notifications/events';

const technicianBookingStatusSchema = z.object({
  status: z.enum(['in_progress', 'awaiting_customer_confirmation']),
});

export async function PATCH(
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

  const parsed = await parseJsonBody(request, technicianBookingStatusSchema);
  if ('response' in parsed) return parsed.response;

  const { status } = parsed.data;

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

  if (booking.technician_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allowed =
    (status === 'in_progress' && booking.status === 'accepted') ||
    (status === 'awaiting_customer_confirmation' &&
      (booking.status === 'in_progress' || booking.status === 'accepted'));

  if (!allowed) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  const writeClient = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data, error } = await writeClient
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('technician_id', auth.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Booking could not be updated (status may have changed)' },
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
    status,
  );

  return NextResponse.json(data);
}
