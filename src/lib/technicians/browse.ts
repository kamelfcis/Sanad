import {
  specialtyToCategorySlug,
  TECHNICIAN_SPECIALTIES,
  type TechnicianSpecialtyValue,
} from '@/lib/constants/technician-registration';
import { resolveTechnicianServicePrice } from '@/lib/pricing/technician-service-price';
import type { BrowseTechnician, TechnicianBrowseBadge } from '@/types/technician-browse';

export interface RawSkill {
  is_active: boolean | null;
  price_override: number | null;
  services: {
    id: string;
    price: number | null;
    service_categories: { slug: string; name_ar: string } | null;
  } | null;
}

export interface RawTechnicianRow {
  id: string;
  governorate: string | null;
  area: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  starting_price: number | null;
  is_available: boolean | null;
  verification_status: string;
  average_rating: number | null;
  completed_jobs: number | null;
  profile_photo_url: string | null;
  provider_role?: string | null;
  contractor_kind?: string | null;
  capacity_tier?: string | null;
  team_size?: number | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
  skills: RawSkill[] | null;
}

function mockDistanceKm(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 1000;
  }
  return Math.round(((hash % 90) + 10) / 10 * 10) / 10;
}

function mockResponseMinutes(isAvailable: boolean, completedJobs: number, id: string): number {
  const seed = Number.parseInt(id.replace(/-/g, '').slice(0, 6), 16) || 0;
  if (isAvailable) return 5 + (seed % 11);
  return 16 + (completedJobs % 45);
}

function resolveStartingPrice(
  activeSkills: RawSkill[],
  options: { categorySlug?: string; primaryServiceId?: string | null },
): number {
  return resolveTechnicianServicePrice(
    activeSkills,
    options.primaryServiceId,
    options.categorySlug,
  );
}

function resolvePrimarySkill(
  activeSkills: RawSkill[],
  categorySlug?: string,
): { label: string; slug: string | null; serviceId: string | null } {
  const matching = categorySlug
    ? activeSkills.find((skill) => skill.services?.service_categories?.slug === categorySlug)
    : null;
  const skill = matching ?? activeSkills[0];
  const category = skill?.services?.service_categories;

  if (category) {
    return {
      label: category.name_ar,
      slug: category.slug,
      serviceId: skill?.services?.id ?? null,
    };
  }

  return { label: 'صنايعي', slug: null, serviceId: skill?.services?.id ?? null };
}

function buildBadges(
  row: RawTechnicianRow,
  averageRating: number,
  responseMinutes: number,
): TechnicianBrowseBadge[] {
  const badges: TechnicianBrowseBadge[] = [];

  if (row.verification_status === 'verified') badges.push('verified');
  if (averageRating >= 4.5) badges.push('high_rating');
  if (responseMinutes <= 10) badges.push('fast_response');
  if (row.is_available) badges.push('available');

  return badges;
}

export function transformBrowseTechnician(
  row: RawTechnicianRow,
  options: { categorySlug?: string } = {},
): BrowseTechnician | null {
  if (!row.profile) return null;

  const activeSkills = (row.skills ?? []).filter((skill) => skill.is_active !== false);
  const primary = resolvePrimarySkill(activeSkills, options.categorySlug);
  const startingPrice = resolveStartingPrice(activeSkills, {
    categorySlug: options.categorySlug,
    primaryServiceId: primary.serviceId,
  });
  const averageRating = Number(row.average_rating ?? 0);
  const completedJobs = Number(row.completed_jobs ?? 0);
  const isAvailable = Boolean(row.is_available);
  const responseMinutes = mockResponseMinutes(isAvailable, completedJobs, row.id);

  return {
    id: row.id,
    full_name: row.profile.full_name,
    avatar_url: row.profile_photo_url ?? row.profile.avatar_url,
    phone: row.profile.phone,
    specialty_label: primary.label,
    specialty_slug: primary.slug,
    area: row.area,
    governorate: row.governorate,
    verification_status: row.verification_status,
    is_available: isAvailable,
    average_rating: averageRating,
    completed_jobs: completedJobs,
    starting_price: startingPrice,
    distance_km: mockDistanceKm(row.id),
    response_time_minutes: responseMinutes,
    location_lat: row.location_lat ?? null,
    location_lng: row.location_lng ?? null,
    badges: buildBadges(row, averageRating, responseMinutes),
    primary_service_id: primary.serviceId,
    provider_role: row.provider_role === 'contractor' ? 'contractor' : 'technician',
    contractor_kind: row.contractor_kind ?? null,
    capacity_tier: row.capacity_tier ?? null,
    team_size: row.team_size ?? null,
  };
}

export function resolveCategorySlug(
  specialty?: string,
  category?: string,
): string | undefined {
  if (category) return category;
  if (!specialty) return undefined;
  return specialtyToCategorySlug(specialty as TechnicianSpecialtyValue);
}

export function technicianMatchesCategory(row: RawTechnicianRow, categorySlug: string): boolean {
  if (categorySlug === 'general-contractor') {
    if (row.contractor_kind === 'integrated') return true;
  }

  const activeSkills = (row.skills ?? []).filter((skill) => skill.is_active !== false);
  return activeSkills.some((skill) => skill.services?.service_categories?.slug === categorySlug);
}

export function specialtyLabelForValue(value: string): string {
  return TECHNICIAN_SPECIALTIES.find((item) => item.value === value)?.label ?? value;
}
