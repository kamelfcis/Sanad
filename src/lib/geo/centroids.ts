import type { EgyptGovernorate } from '@/lib/constants/technician-registration';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Approximate centroids for Egypt governorates (fallback when tech has no lat/lng). */
export const EGYPT_GOVERNORATE_CENTROIDS: Record<EgyptGovernorate, GeoPoint> = {
  'القاهرة': { lat: 30.0444, lng: 31.2357 },
  'الجيزة': { lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187 },
  'القليوبية': { lat: 30.402, lng: 31.3086 },
  'الشرقية': { lat: 30.5965, lng: 31.5041 },
  'الدقهلية': { lat: 31.0341, lng: 31.3817 },
  'المنوفية': { lat: 30.5971, lng: 30.9876 },
  'الغربية': { lat: 30.8754, lng: 31.0336 },
  'البحيرة': { lat: 30.8481, lng: 30.3436 },
  'أسوان': { lat: 24.0889, lng: 32.8998 },
  'الأقصر': { lat: 25.6872, lng: 32.6396 },
  'أسيوط': { lat: 27.1783, lng: 31.1859 },
};

export const CAIRO_DEFAULT: GeoPoint = EGYPT_GOVERNORATE_CENTROIDS['القاهرة'];

export function getGovernorateCentroid(governorate: string | null | undefined): GeoPoint | null {
  if (!governorate) return null;
  return EGYPT_GOVERNORATE_CENTROIDS[governorate as EgyptGovernorate] ?? null;
}
