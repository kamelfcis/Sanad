import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { assignmentRespondSchema } from '@/lib/validations/assignments';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { notifyBookingAccepted } from '@/lib/notifications/events';

export async function POST(
  request: NextRequest,
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

  const parsed = await parseJsonBody(request, assignmentRespondSchema);
  if ('response' in parsed) return parsed.response;

  const { action } = parsed.data;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data: assignment, error: fetchError } = await db
    .from('booking_assignments')
    .select('*, booking:bookings!inner(id, status)')
    .eq('id', id)
    .eq('technician_id', auth.user.id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  if (assignment.status !== 'pending') {
    return NextResponse.json({ error: 'Assignment already responded to' }, { status: 400 });
  }

  const bookingId = (assignment.booking as { id: string }).id;
  const now = new Date().toISOString();

  if (action === 'accept') {
    const { error: assignErr } = await db
      .from('booking_assignments')
      .update({ status: 'accepted', response_at: now })
      .eq('id', id);

    if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });

    const { error: bookingErr } = await db
      .from('bookings')
      .update({ status: 'accepted', technician_id: auth.user.id, updated_at: now })
      .eq('id', bookingId);

    if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 });

    await db
      .from('chat_conversations')
      .upsert({ booking_id: bookingId }, { onConflict: 'booking_id' });

    await db
      .from('booking_assignments')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .neq('id', id);

    const { data: bookingDetails } = await db
      .from('bookings')
      .select('customer_id, services(name_ar)')
      .eq('id', bookingId)
      .single();

    if (bookingDetails) {
      const { data: techProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', auth.user.id)
        .single();

      await notifyBookingAccepted(
        bookingDetails.customer_id,
        {
          bookingId,
          serviceName: (bookingDetails.services as { name_ar?: string } | null)?.name_ar,
        },
        techProfile?.full_name ?? undefined,
      );
    }

    return NextResponse.json({ success: true, action: 'accepted' });
  }

  const { error: rejectErr } = await db
    .from('booking_assignments')
    .update({ status: 'rejected', response_at: now })
    .eq('id', id);

  if (rejectErr) return NextResponse.json({ error: rejectErr.message }, { status: 500 });

  const { count } = await db
    .from('booking_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('status', 'pending');

  if (count === 0) {
    try {
      const rpcClient = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;
      await rpcClient.rpc('assign_next_available_tech', { p_booking_id: bookingId });
    } catch (e) {
      console.error('Failed to assign next tech:', e);
      await db
        .from('bookings')
        .update({ status: 'pending', updated_at: now })
        .eq('id', bookingId);
    }
  }

  return NextResponse.json({ success: true, action: 'rejected' });
}
