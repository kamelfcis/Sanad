import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { parseSearchParams } from '@/lib/api/validate';
import { browseTechniciansQuerySchema } from '@/lib/validations/technicians';
import {
  resolveCategorySlug,
  specialtyLabelForValue,
  technicianMatchesCategory,
  transformBrowseTechnician,
} from '@/lib/technicians/browse';
import type { BrowseTechnician } from '@/types/technician-browse';
import type { RawTechnicianRow } from '@/lib/technicians/browse';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, browseTechniciansQuerySchema);
  if ('response' in query) return query.response;

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
    .eq('verification_status', 'verified');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    search,
    specialty,
    category,
    governorate,
    sort,
    maxPrice,
    availableOnly,
    lat,
    lng,
    page,
    limit,
  } = query.data;

  const userLocation = lat != null && lng != null ? { lat, lng } : undefined;
  const categorySlug = resolveCategorySlug(specialty, category);
  const searchQuery = search?.trim().toLowerCase();

  let rows: RawTechnicianRow[] = (data ?? []).map((row) => {
    const record = row as unknown as RawTechnicianRow & {
      profile: RawTechnicianRow['profile'] | NonNullable<RawTechnicianRow['profile']>[];
    };

    return {
      ...record,
      profile: Array.isArray(record.profile) ? record.profile[0] ?? null : record.profile,
    };
  });

  if (categorySlug) {
    rows = rows.filter((row) => technicianMatchesCategory(row, categorySlug));
  }

  let technicians: BrowseTechnician[] = rows
    .map((row) =>
      transformBrowseTechnician(row, {
        categorySlug,
        includePhone,
        userLocation,
      }),
    )
    .filter((item): item is BrowseTechnician => item != null);

  if (governorate) {
    technicians = technicians.filter((item) => item.governorate === governorate);
  }

  if (availableOnly) {
    technicians = technicians.filter((item) => item.is_available);
  }

  if (maxPrice != null) {
    technicians = technicians.filter(
      (item) => item.starting_price === 0 || item.starting_price <= maxPrice,
    );
  }

  if (searchQuery) {
    technicians = technicians.filter((item) => {
      const haystack = [
        item.full_name,
        item.area,
        item.governorate,
        item.specialty_label,
        specialty ? specialtyLabelForValue(specialty) : null,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchQuery);
    });
  }

  technicians.sort((a, b) => {
    switch (sort) {
      case 'price':
        return a.starting_price - b.starting_price;
      case 'distance':
        return a.distance_km - b.distance_km;
      case 'response':
        return a.response_time_minutes - b.response_time_minutes;
      case 'rating':
      default:
        return b.average_rating - a.average_rating || b.completed_jobs - a.completed_jobs;
    }
  });

  const total = technicians.length;
  const offset = (page - 1) * limit;
  const paginated = technicians.slice(offset, offset + limit);

  return NextResponse.json({
    technicians: paginated,
    total,
    page,
    limit,
  });
}
