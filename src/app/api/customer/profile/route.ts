import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { customerProfileSchema } from '@/lib/validations/customer-profile';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'full_name, phone, default_address, default_location_lat, default_location_lng, default_apartment_number, default_floor_number, role',
    )
    .eq('id', auth.user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'للعملاء فقط' }, { status: 403 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, customerProfileSchema);
  if ('response' in parsed) return parsed.response;

  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single();

  if (existing?.role !== 'customer') {
    return NextResponse.json({ error: 'للعملاء فقط' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      default_address: parsed.data.default_address,
      default_location_lat: parsed.data.default_location_lat,
      default_location_lng: parsed.data.default_location_lng,
      default_apartment_number: parsed.data.default_apartment_number ?? null,
      default_floor_number: parsed.data.default_floor_number ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)
    .select(
      'full_name, phone, default_address, default_location_lat, default_location_lng, default_apartment_number, default_floor_number',
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
