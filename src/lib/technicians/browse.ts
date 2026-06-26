import {
  specialtyToCategorySlug,
  TECHNICIAN_SPECIALTIES,
  type TechnicianSpecialtyValue,
} from '@/lib/constants/technician-registration';
import { getGovernorateCentroid, haversineDistanceKm, type GeoPoint } from '@/lib/geo';
import type { BrowseTechnician, TechnicianBrowseBadge } from '@/types/technician-browse';

interface RawSkill {
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
  location_lat: number | null;
  location_lng: number | null;
  starting_price: number | null;
  is_available: boolean | null;
  verification_status: string;
  average_rating: number | null;
  completed_jobs: number | null;
  profile_photo_url: string | null;
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

export function resolveTechnicianCoords(row: RawTechnicianRow): GeoPoint | null {
  if (row.location_lat != null && row.location_lng != null) {
    return { lat: Number(row.location_lat), lng: Number(row.location_lng) };
  }
  return getGovernorateCentroid(row.governorate);
}

export function calculateDistanceKm(
  userLocation: GeoPoint | undefined,
  row: RawTechnicianRow,
): number {
  const techCoords = resolveTechnicianCoords(row);
  if (userLocation && techCoords) {
    const km = haversineDistanceKm(
      userLocation.lat,
      userLocation.lng,
      techCoords.lat,
      techCoords.lng,
    );
    return Math.round(km * 10) / 10;
  }
  return mockDistanceKm(row.id);
}

function mockResponseMinutes(isAvailable: boolean, completedJobs: number, id: string): number {
  const seed = Number.parseInt(id.replace(/-/g, '').slice(0, 6), 16) || 0;
  if (isAvailable) return 5 + (seed % 11);
  return 16 + (completedJobs % 45);
}

function resolveStartingPrice(row: RawTechnicianRow, activeSkills: RawSkill[]): number {
  if (row.starting_price != null) return Number(row.starting_price);

  const prices = activeSkills
    .map((skill) => skill.price_override ?? skill.services?.price ?? null)
    .filter((price): price is number => price != null);

  if (prices.length === 0) return 0;
  return Math.min(...prices);
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
  options: {
    categorySlug?: string;
    includePhone?: boolean;
    userLocation?: GeoPoint;
  },
): BrowseTechnician | null {
  if (!row.profile) return null;

  const activeSkills = (row.skills ?? []).filter((skill) => skill.is_active !== false);
  const primary = resolvePrimarySkill(activeSkills, options.categorySlug);
  const averageRating = Number(row.average_rating ?? 0);
  const completedJobs = Number(row.completed_jobs ?? 0);
  const isAvailable = Boolean(row.is_available);
  const responseMinutes = mockResponseMinutes(isAvailable, completedJobs, row.id);
  const coords = resolveTechnicianCoords(row);

  return {
    id: row.id,
    full_name: row.profile.full_name,
    avatar_url: row.profile_photo_url ?? row.profile.avatar_url,
    phone: options.includePhone ? row.profile.phone : null,
    specialty_label: primary.label,
    specialty_slug: primary.slug,
    area: row.area,
    governorate: row.governorate,
    verification_status: row.verification_status,
    is_available: isAvailable,
    average_rating: averageRating,
    completed_jobs: completedJobs,
    starting_price: resolveStartingPrice(row, activeSkills),
    distance_km: calculateDistanceKm(options.userLocation, row),
    location_lat: coords?.lat ?? null,
    location_lng: coords?.lng ?? null,
    response_time_minutes: responseMinutes,
    badges: buildBadges(row, averageRating, responseMinutes),
    primary_service_id: primary.serviceId,
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
  const activeSkills = (row.skills ?? []).filter((skill) => skill.is_active !== false);
  return activeSkills.some((skill) => skill.services?.service_categories?.slug === categorySlug);
}

export function specialtyLabelForValue(value: string): string {
  return TECHNICIAN_SPECIALTIES.find((item) => item.value === value)?.label ?? value;
}
