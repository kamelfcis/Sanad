import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseSearchParams } from '@/lib/api/validate';
import { emptyQuerySchema } from '@/lib/validations/common';
import { fetchActiveHeroSlides } from '@/lib/hero-slides/queries';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();

  try {
    const slides = await fetchActiveHeroSlides(supabase);
    return NextResponse.json(slides);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hero slides';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
