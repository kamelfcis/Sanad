import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseSearchParams } from '@/lib/api/validate';
import { listServicesQuerySchema } from '@/lib/validations/services';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const query = parseSearchParams(request.nextUrl.searchParams, listServicesQuerySchema);
  if ('response' in query) return query.response;

  let dbQuery = supabase
    .from('services')
    .select('*, service_categories!inner(name_ar, name_en, slug)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (query.data.category) {
    dbQuery = dbQuery.eq('service_categories.slug', query.data.category);
  }

  if (query.data.category_id) {
    dbQuery = dbQuery.eq('category_id', query.data.category_id);
  }

  if (query.data.id) {
    dbQuery = dbQuery.eq('id', query.data.id);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
