import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { paginationPageSchema } from '@/lib/validations/common';
import { parseSearchParams } from '@/lib/api/validate';
import { z } from 'zod';

const querySchema = paginationPageSchema.extend({
  status: z.enum(['open', 'reviewing', 'closed']).optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, querySchema);
  if ('response' in query) return query.response;

  const { status, page, limit } = query.data;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('complaints')
    .select(
      `
      *,
      booking:bookings(id, status),
      customer:profiles!customer_id(full_name, phone),
      technician:profiles!technician_id(full_name, phone)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (status) dbQuery = dbQuery.eq('status', status);

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    complaints: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
