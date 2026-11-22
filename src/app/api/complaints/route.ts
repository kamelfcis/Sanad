import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { createComplaintSchema } from '@/lib/validations/complaints';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const body = await parseJsonBody(request, createComplaintSchema);
  if ('response' in body) return body.response;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'الشكاوى متاحة للعملاء فقط' }, { status: 403 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customer_id, technician_id, status')
    .eq('id', body.data.booking_id)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!booking || booking.customer_id !== auth.user.id) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }
  if (!booking.technician_id) {
    return NextResponse.json({ error: 'لا يوجد مقاول مرتبط بهذا الحجز' }, { status: 400 });
  }

  const { data: complaint, error } = await supabase
    .from('complaints')
    .insert({
      booking_id: booking.id,
      customer_id: auth.user.id,
      technician_id: booking.technician_id,
      body: body.data.body,
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'سبق تقديم شكوى على هذا الحجز' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ complaint }, { status: 201 });
}
