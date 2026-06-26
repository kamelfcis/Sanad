import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminListReviewsQuerySchema } from '@/lib/validations/reviews';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminListReviewsQuerySchema);
  if ('response' in query) return query.response;

  const { hidden } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('reviews')
    .select(
      `
      *,
      customer:profiles!reviews_customer_id_fkey(full_name, avatar_url),
      technician:profiles!reviews_technician_id_fkey(full_name)
    `,
      { count: 'exact' },
    );

  if (hidden === 'true') dbQuery = dbQuery.eq('is_hidden', true);
  else if (hidden === 'false') dbQuery = dbQuery.eq('is_hidden', false);

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [], total: count ?? 0, page, limit });
}
