import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminCustomersQuerySchema } from '@/lib/validations/technicians';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminCustomersQuerySchema);
  if ('response' in query) return query.response;

  const { search } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'customer');

  if (search) {
    dbQuery = dbQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customerIds = data?.map((c) => c.id) ?? [];
  const { data: bookingCounts } = await supabase
    .from('bookings')
    .select('customer_id')
    .in('customer_id', customerIds);

  const countMap: Record<string, number> = {};
  bookingCounts?.forEach((b) => {
    countMap[b.customer_id] = (countMap[b.customer_id] ?? 0) + 1;
  });

  const enriched = data?.map((c) => ({
    ...c,
    booking_count: countMap[c.id] ?? 0,
  }));

  return NextResponse.json({
    customers: enriched ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
