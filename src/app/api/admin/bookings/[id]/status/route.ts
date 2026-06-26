import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminBookingStatusSchema, adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingStatusChange } from '@/lib/notifications/events';

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

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, adminBookingStatusSchema);
  if ('response' in parsed) return parsed.response;

  const { status, reason } = parsed.data;

  const { data: booking } = await supabase
    .from('bookings')
    .select('status, customer_id, technician_id, services(name_ar)')
    .eq('id', bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const oldStatus = booking.status;

  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'booking_status_update',
    entity_type: 'booking',
    entity_id: bookingId,
    metadata: { from: oldStatus, to: status, reason: reason ?? null },
  });

  if (['in_progress', 'completed', 'cancelled'].includes(status)) {
    const serviceName = (booking.services as { name_ar?: string } | null)?.name_ar;
    await notifyBookingStatusChange(
      {
        bookingId,
        serviceName,
        customerId: booking.customer_id,
        technicianId: booking.technician_id,
      },
      status as 'in_progress' | 'completed' | 'cancelled',
      reason ?? undefined,
    );
  }

  return NextResponse.json(data);
}
