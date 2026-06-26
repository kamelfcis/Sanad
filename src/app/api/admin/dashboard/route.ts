import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { emptyQuerySchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const [
    customers,
    techs,
    verifiedTechs,
    pendingTechs,
    suspendedTechs,
    bookings,
    pendingBk,
    inProgressBk,
    completedBk,
    cancelledBk,
    reviews,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('technician_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['matched', 'accepted', 'in_progress']),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ]);

  const { data: avgRating } = await supabase.from('reviews').select('rating');
  const totalRating = avgRating?.reduce((sum, r) => sum + r.rating, 0) ?? 0;
  const avgRatingValue = avgRating && avgRating.length > 0 ? totalRating / avgRating.length : 0;

  const { data: approvedPayments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'approved');

  const revenueTotal = approvedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const revenueByMonth: Record<string, number> = {};
  approvedPayments?.forEach((p) => {
    const key = new Date(p.created_at).toISOString().slice(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + Number(p.amount);
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentTrendBookings } = await supabase
    .from('bookings')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  const bookingTrendsMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    bookingTrendsMap[d.toISOString().slice(0, 10)] = 0;
  }
  recentTrendBookings?.forEach((b) => {
    const key = new Date(b.created_at).toISOString().slice(0, 10);
    if (key in bookingTrendsMap) {
      bookingTrendsMap[key]++;
    }
  });

  const booking_trends = Object.entries(bookingTrendsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const { data: recentBookingsRaw } = await supabase
    .from('bookings')
    .select(`
      id, status, created_at,
      services(name_en),
      customer:profiles!bookings_customer_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(8);

  const recent_bookings = (recentBookingsRaw ?? []).map((b) => {
    const svc = b.services as unknown as { name_en: string } | null;
    const cust = b.customer as unknown as { full_name: string | null } | null;
    return {
      id: b.id,
      service_name: svc?.name_en ?? 'Unknown service',
      customer_name: cust?.full_name ?? 'Unknown customer',
      status: b.status,
      created_at: b.created_at,
    };
  });

  const { data: topTechsRaw } = await supabase
    .from('technician_profiles')
    .select(`
      id, completed_jobs, average_rating,
      profile:profiles!inner(full_name)
    `)
    .order('completed_jobs', { ascending: false })
    .limit(5);

  const top_technicians = (topTechsRaw ?? []).map((t) => {
    const profile = t.profile as unknown as { full_name: string | null };
    return {
      id: t.id,
      full_name: profile?.full_name ?? 'Unknown',
      completed_jobs: t.completed_jobs ?? 0,
      average_rating: Number(t.average_rating ?? 0),
    };
  });

  return NextResponse.json({
    overview: {
      total_technicians: techs.count ?? 0,
      verified_technicians: verifiedTechs.count ?? 0,
      pending_technicians: pendingTechs.count ?? 0,
      suspended_technicians: suspendedTechs.count ?? 0,
      total_customers: customers.count ?? 0,
      total_bookings: bookings.count ?? 0,
      completed_bookings: completedBk.count ?? 0,
      pending_bookings: pendingBk.count ?? 0,
      in_progress_bookings: inProgressBk.count ?? 0,
      cancelled_bookings: cancelledBk.count ?? 0,
      total_reviews: reviews.count ?? 0,
      average_rating: Number(avgRatingValue.toFixed(1)),
    },
    revenue: {
      total: revenueTotal,
      by_month: Object.entries(revenueByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount })),
    },
    recent_bookings,
    top_technicians,
    booking_trends,
  });
}
