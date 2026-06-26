import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import {
  createReviewSchema,
  listReviewsQuerySchema,
} from '@/lib/validations/reviews';
import { notifyReviewReceived } from '@/lib/notifications/events';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const query = parseSearchParams(request.nextUrl.searchParams, listReviewsQuerySchema);
  if ('response' in query) return query.response;

  const { technician_id: technicianId, booking_id: bookingId, limit, offset } = query.data;

  let dbQuery = supabase
    .from('reviews')
    .select(
      `
      *,
      customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)
    `,
      { count: 'exact' },
    )
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (technicianId) dbQuery = dbQuery.eq('technician_id', technicianId);
  if (bookingId) dbQuery = dbQuery.eq('booking_id', bookingId);

  const { data, error, count } = await dbQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (bookingId) {
    return NextResponse.json(data?.[0] ?? null);
  }

  return NextResponse.json({
    reviews: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, createReviewSchema);
  if ('response' in parsed) return parsed.response;

  const { booking_id, rating, comment } = parsed.data;

  const { data: booking } = await supabase
    .from('bookings')
    .select('customer_id, technician_id, status')
    .eq('id', booking_id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.customer_id !== auth.user.id) {
    return NextResponse.json({ error: 'You can only review your own bookings' }, { status: 403 });
  }

  if (booking.technician_id === auth.user.id) {
    return NextResponse.json({ error: 'Technicians cannot review their own work' }, { status: 403 });
  }

  if (booking.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
  }

  if (!booking.technician_id) {
    return NextResponse.json({ error: 'No technician assigned to this booking' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 409 });
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      booking_id,
      customer_id: auth.user.id,
      technician_id: booking.technician_id,
      rating,
      comment: comment?.trim() || null,
    })
    .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customerName =
    (review.customer as { full_name?: string | null } | null)?.full_name ?? undefined;
  await notifyReviewReceived(booking.technician_id, review.id, rating, customerName);

  return NextResponse.json(review, { status: 201 });
}
