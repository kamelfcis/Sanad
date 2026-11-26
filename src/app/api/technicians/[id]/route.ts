import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { uuidSchema } from '@/lib/validations/common';
import {
  resolveCategorySlug,
  transformBrowseTechnician,
  type RawTechnicianRow,
} from '@/lib/technicians/browse';
import { resolveTechnicianServicePrice } from '@/lib/pricing/technician-service-price';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const serviceId = request.nextUrl.searchParams.get('service_id') ?? undefined;
  const category = request.nextUrl.searchParams.get('category') ?? undefined;
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
      is_demo,
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
    .eq('is_available', true)
    .eq('is_demo', false)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const { data: activeSubscription, error: subscriptionError } = await supabase
    .from('provider_subscriptions')
    .select('provider_id')
    .eq('provider_id', parsed.data)
    .gt('active_until', new Date().toISOString())
    .maybeSingle();
  if (subscriptionError) {
    return NextResponse.json({ error: 'Unable to verify provider subscription.' }, { status: 500 });
  }
  if (!activeSubscription) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const record = data as unknown as RawTechnicianRow & {
    profile: RawTechnicianRow['profile'] | NonNullable<RawTechnicianRow['profile']>[];
  };

  const row: RawTechnicianRow = {
    ...record,
    profile: Array.isArray(record.profile) ? record.profile[0] ?? null : record.profile,
  };

  const categorySlug = resolveCategorySlug(undefined, category);
  const technician = transformBrowseTechnician(row, { categorySlug });
  if (!technician) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const activeSkills = (row.skills ?? []).filter((skill) => skill.is_active !== false);
  const quotedPrice = resolveTechnicianServicePrice(
    activeSkills,
    serviceId ?? technician.primary_service_id,
    categorySlug,
  );

  return NextResponse.json({ ...technician, quoted_price: quotedPrice });
}
