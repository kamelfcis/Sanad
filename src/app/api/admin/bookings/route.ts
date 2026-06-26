import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminBookingsQuerySchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminBookingsQuerySchema);
  if ('response' in query) return query.response;

  const { status } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 50;
  const offset = (page - 1) * limit;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  let dbQuery = db
    .from('bookings')
    .select(
      `
      *,
      services(name_ar, name_en, slug),
      customer:profiles!bookings_customer_id_fkey(id, full_name, email),
      technician:profiles!bookings_technician_id_fkey(id, full_name, email)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bookings: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
