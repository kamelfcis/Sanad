import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { emptyQuerySchema } from '@/lib/validations/common';
import { createHeroSlideSchema, reorderHeroSlidesSchema } from '@/lib/validations/hero-slides';
import { fetchAllHeroSlides } from '@/lib/hero-slides/queries';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  try {
    const slides = await fetchAllHeroSlides(supabase);
    return NextResponse.json(slides);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hero slides';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, createHeroSlideSchema);
  if ('response' in parsed) return parsed.response;

  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: maxRow } = await supabase
      .from('hero_slides')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .insert({ ...parsed.data, sort_order: sortOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'hero_slide_create',
    entity_type: 'hero_slide',
    entity_id: data.id,
    metadata: { title_ar: parsed.data.title_ar },
  });

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, reorderHeroSlidesSchema);
  if ('response' in parsed) return parsed.response;

  const updates = parsed.data.ordered_ids.map((id, index) =>
    supabase.from('hero_slides').update({ sort_order: index + 1 }).eq('id', id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'hero_slide_reorder',
    entity_type: 'hero_slide',
    metadata: { ordered_ids: parsed.data.ordered_ids },
  });

  const slides = await fetchAllHeroSlides(supabase);
  return NextResponse.json(slides);
}
