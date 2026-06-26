import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { updateTechnicianProfileSchema } from '@/lib/validations/technicians';
import { emptyQuerySchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data, error } = await supabase
    .from('technician_profiles')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, updateTechnicianProfileSchema);
  if ('response' in parsed) return parsed.response;

  const { bio, years_experience, max_distance_km, is_available, phone } = parsed.data;

  const { data, error } = await supabase
    .from('technician_profiles')
    .upsert({
      id: auth.user.id,
      bio: bio ?? null,
      years_experience: years_experience ?? null,
      max_distance_km: max_distance_km ?? 20.0,
      is_available: is_available ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (phone) {
    await supabase.from('profiles').update({ phone }).eq('id', auth.user.id);
  }

  return NextResponse.json(data);
}
