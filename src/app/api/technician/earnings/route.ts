import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/technician/earnings
 * Derives a technician's earnings from their bookings + the associated manual
 * payments (no payouts table). Payments RLS does not grant technicians read
 * access, so aggregation runs with the service role and is manually scoped to
 * the authenticated technician's own bookings.
 *
 * Returns:
 *  - totalEarned:   sum of APPROVED payment amounts
 *  - totalPending:  sum of PENDING payment amounts (awaiting admin approval)
 *  - completedJobs: count of completed bookings
 *  - jobs[]:        per-job breakdown (service, date, amount, paymentStatus)
 */
interface EarningsJob {
  bookingId: string;
  serviceName: string | null;
  status: string;
  createdAt: string;
  amount: number;
  paymentStatus: 'approved' | 'pending' | 'rejected' | 'unpaid';
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data: bookings, error: bookingsError } = await db
    .from('bookings')
    .select('id, status, price_quote, created_at, services(name_ar)')
    .eq('technician_id', auth.user.id)
    .in('status', ['accepted', 'in_progress', 'completed'])
    .order('created_at', { ascending: false });

  if (bookingsError) {
    logger.error('technician earnings: bookings fetch failed', bookingsError, {
      technicianId: auth.user.id,
    });
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  const rows = bookings ?? [];
  const bookingIds = rows.map((b) => b.id);

  const paymentByBooking = new Map<string, { amount: number; status: string }>();
  if (bookingIds.length > 0) {
    const { data: payments, error: paymentsError } = await db
      .from('payments')
      .select('booking_id, amount, status')
      .in('booking_id', bookingIds);

    if (paymentsError) {
      logger.error('technician earnings: payments fetch failed', paymentsError, {
        technicianId: auth.user.id,
      });
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    for (const p of payments ?? []) {
      paymentByBooking.set(p.booking_id, { amount: Number(p.amount), status: p.status });
    }
  }

  let totalEarned = 0;
  let totalPending = 0;
  let completedJobs = 0;

  const jobs: EarningsJob[] = rows.map((b) => {
    const payment = paymentByBooking.get(b.id);
    const amount = payment ? payment.amount : Number(b.price_quote ?? 0);
    const paymentStatus = (payment?.status as EarningsJob['paymentStatus']) ?? 'unpaid';

    if (paymentStatus === 'approved') totalEarned += amount;
    if (paymentStatus === 'pending') totalPending += amount;
    if (b.status === 'completed') completedJobs += 1;

    return {
      bookingId: b.id,
      serviceName: (b.services as { name_ar?: string } | null)?.name_ar ?? null,
      status: b.status,
      createdAt: b.created_at,
      amount,
      paymentStatus,
    };
  });

  return NextResponse.json({
    totalEarned,
    totalPending,
    completedJobs,
    jobs,
  });
}
