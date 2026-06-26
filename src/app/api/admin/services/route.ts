import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { createServiceSchema, listServicesQuerySchema } from '@/lib/validations/services';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, listServicesQuerySchema);
  if ('response' in query) return query.response;

  let dbQuery = supabase
    .from('services')
    .select('*, service_categories(name_ar, name_en)')
    .order('name_ar', { ascending: true });

  if (query.data.category_id) {
    dbQuery = dbQuery.eq('category_id', query.data.category_id);
  }

  const { data, error } = await dbQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, createServiceSchema);
  if ('response' in parsed) return parsed.response;

  const { category_id, name_ar, name_en, slug, description, price, price_type, is_active } = parsed.data;

  const { data, error } = await supabase
    .from('services')
    .insert({ category_id, name_ar, name_en, slug, description, price, price_type, is_active })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'service_create',
    entity_type: 'service',
    entity_id: data.id,
    metadata: { name_ar, name_en, slug },
  });

  return NextResponse.json(data, { status: 201 });
}
