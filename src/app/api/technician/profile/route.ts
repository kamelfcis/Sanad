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

  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = bio;
  if (years_experience !== undefined) updates.years_experience = years_experience;
  if (max_distance_km !== undefined) updates.max_distance_km = max_distance_km;
  if (is_available !== undefined) updates.is_available = is_available;

  if (Object.keys(updates).length === 0 && !phone) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  let profileData = null;

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('technician_profiles')
      .update(updates)
      .eq('id', auth.user.id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }
    profileData = data;
  } else {
    const { data, error } = await supabase
      .from('technician_profiles')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    profileData = data;
  }

  if (phone) {
    await supabase.from('profiles').update({ phone }).eq('id', auth.user.id);
  }

  return NextResponse.json(profileData);
}
