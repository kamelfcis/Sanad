import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminPaymentsQuerySchema } from '@/lib/validations/payments';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminPaymentsQuerySchema);
  if ('response' in query) return query.response;

  const { status } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('payments')
    .select(
      `
      *,
      customer:profiles!payments_customer_id_fkey(full_name, email),
      booking:bookings!booking_id(
        id,
        status,
        services(name_ar, name_en)
      )
    `,
      { count: 'exact' },
    );

  if (status) dbQuery = dbQuery.eq('status', status);

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: data ?? [], total: count ?? 0, page, limit });
}
