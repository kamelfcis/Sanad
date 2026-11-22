import type { z } from 'zod';
import type { browseTechniciansQuerySchema } from '@/lib/validations/technicians';
import {
  resolveCategorySlug,
  specialtyLabelForValue,
  technicianMatchesCategory,
  transformBrowseTechnician,
  type RawTechnicianRow,
} from '@/lib/technicians/browse';
import type { BrowseTechniciansResponse } from '@/types/technician-browse';
import { createServiceRoleClient } from '@/lib/supabase/admin';

const BROWSE_SELECT = `
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
  provider_role,
  contractor_kind,
  capacity_tier,
  team_size,
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
`;

type BrowseQuery = z.infer<typeof browseTechniciansQuerySchema>;

export async function listBrowseTechnicians(
  query: BrowseQuery,
): Promise<BrowseTechniciansResponse> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('technician_profiles')
    .select(BROWSE_SELECT)
    .eq('verification_status', 'verified')
    .eq('is_demo', false);

  if (error) {
    throw new Error(error.message);
  }

  const {
    search,
    specialty,
    category,
    governorate,
    sort,
    maxPrice,
    availableOnly,
    providerRole,
    contractorKind,
    capacityTier,
    teamSize,
    lat,
    lng,
    page,
    limit,
  } = query;

  const categorySlug = resolveCategorySlug(specialty, category);
  const searchQuery = search?.trim().toLowerCase();
  const userLocation = lat != null && lng != null ? { lat, lng } : undefined;

  let rows: RawTechnicianRow[] = (data ?? []).map((row) => {
    const record = row as unknown as RawTechnicianRow & {
      profile: RawTechnicianRow['profile'] | NonNullable<RawTechnicianRow['profile']>[];
    };

    return {
      ...record,
      profile: Array.isArray(record.profile) ? record.profile[0] ?? null : record.profile,
    };
  });

  const technicianIds = rows.map((row) => row.id);
  if (technicianIds.length > 0) {
    const { data: completedBookings, error: completedBookingsError } = await supabase
      .from('bookings')
      .select('technician_id')
      .eq('status', 'completed')
      .in('technician_id', technicianIds);

    if (completedBookingsError) {
      throw new Error(completedBookingsError.message);
    }

    const completedJobsByTechnician = new Map<string, number>();
    for (const booking of completedBookings ?? []) {
      if (booking.technician_id) {
        completedJobsByTechnician.set(
          booking.technician_id,
          (completedJobsByTechnician.get(booking.technician_id) ?? 0) + 1,
        );
      }
    }

    rows = rows.map((row) => ({
      ...row,
      completed_jobs: completedJobsByTechnician.get(row.id) ?? 0,
    }));
  }

  if (categorySlug) {
    rows = rows.filter((row) => technicianMatchesCategory(row, categorySlug));
  }

  if (providerRole) {
    rows = rows.filter((row) => (row.provider_role ?? 'technician') === providerRole);
  }

  if (contractorKind) {
    rows = rows.filter(
      (row) =>
        (row.provider_role ?? 'technician') === 'contractor' &&
        (row.contractor_kind ?? 'specialist') === contractorKind,
    );
  }

  if (capacityTier) {
    rows = rows.filter(
      (row) =>
        (row.provider_role ?? 'technician') === 'contractor' &&
        (row.capacity_tier ?? 'none') === capacityTier,
    );
  }

  if (teamSize) {
    rows = rows.filter(
      (row) => (row.provider_role ?? 'technician') === 'contractor' && row.team_size === teamSize,
    );
  }

  let technicians = rows
    .map((row) =>
      transformBrowseTechnician(row, {
        categorySlug,
        userLocation,
      }),
    )
    .filter((item): item is NonNullable<typeof item> => item != null);

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
        return (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY);
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

  return {
    technicians: paginated,
    total,
    page,
    limit,
  };
}
