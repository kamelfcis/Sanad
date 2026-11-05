import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { adminAssignTechnicianSchema } from '@/lib/validations/assignments';
import { adminEntityIdSchema } from '@/lib/validations/admin';

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

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, adminAssignTechnicianSchema);
  if ('response' in parsed) return parsed.response;

  const { technician_id } = parsed.data;

  const { data: techProfile } = await supabase
    .from('technician_profiles')
    .select('id, verification_status')
    .eq('id', technician_id)
    .single();

  if (!techProfile) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  await supabase
    .from('booking_assignments')
    .update({ status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('status', 'pending');

  const { error: assignErr } = await supabase
    .from('booking_assignments')
    .upsert({
      booking_id: bookingId,
      technician_id,
      status: 'accepted',
    })
    .select()
    .single();

  if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });

  const { data: booking } = await supabase
    .from('bookings')
    .update({
      technician_id,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  return NextResponse.json({ success: true, booking });
}
