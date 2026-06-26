import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { uuidSchema } from '@/lib/validations/common';
import { transformBrowseTechnician, type RawTechnicianRow } from '@/lib/technicians/browse';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid technician id' }, { status: 400 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'خدمة البحث غير متاحة حالياً. يرجى المحاولة لاحقاً.' },
      { status: 503 },
    );
  }

  const supabaseAuth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  let includePhone = false;
  if (user) {
    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    includePhone = profile?.role === 'customer' || profile?.role === 'admin';
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('technician_profiles')
    .select(
      `
      id,
      governorate,
      area,
      location_lat,
      location_lng,
      starting_price,
      is_available,
      verification_status,
      average_rating,
      completed_jobs,
      profile_photo_url,
      profile:profiles!inner(full_name, avatar_url, phone),
      skills:technician_skills(
        is_active,
        price_override,
        services(
          id,
          price,
          service_categories(slug, name_ar)
        )
      )
    `,
    )
    .eq('id', parsed.data)
    .eq('verification_status', 'verified')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const record = data as unknown as RawTechnicianRow & {
    profile: RawTechnicianRow['profile'] | NonNullable<RawTechnicianRow['profile']>[];
  };

  const row: RawTechnicianRow = {
    ...record,
    profile: Array.isArray(record.profile) ? record.profile[0] ?? null : record.profile,
  };

  const technician = transformBrowseTechnician(row, { includePhone });
  if (!technician) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  return NextResponse.json(technician);
}
