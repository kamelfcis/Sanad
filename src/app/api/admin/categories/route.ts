import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { adminCategoriesQuerySchema, createCategorySchema } from '@/lib/validations/categories';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, adminCategoriesQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { search } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 25;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('service_categories')
    .select('*', { count: 'exact' })
    .order('name_ar', { ascending: true });

  if (search) {
    dbQuery = dbQuery.or(
      `name_ar.ilike.%${search}%,name_en.ilike.%${search}%,slug.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    categories: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, createCategorySchema);
  if ('response' in parsed) return parsed.response;

  const { name_ar, name_en, slug, description, icon, icon_type, is_active } = parsed.data;

  const { data, error } = await supabase
    .from('service_categories')
    .insert({ name_ar, name_en, slug, description, icon, icon_type, is_active })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'category_create',
    entity_type: 'category',
    entity_id: data.id,
    metadata: { name_ar, name_en, slug },
  });

  return NextResponse.json(data, { status: 201 });
}
