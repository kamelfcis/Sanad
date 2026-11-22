import type { GeoPoint } from '@/lib/geo/centroids';

/**
 * Keep a map click as latitude then longitude, rounded to DECIMAL(10,7).
 * Do not swap a point just because latitude is greater than longitude:
 * that is true for Alexandria and false for Cairo, so it is not an axis error.
 * Swap only when latitude cannot exist (outside -90..90) and exchanging the axes yields a valid pair.
 */
export function normalizeEgyptCoords(lat: number, lng: number): GeoPoint {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat, lng };
  }

  let nextLat = lat;
  let nextLng = lng;
  if (Math.abs(nextLat) > 90 && Math.abs(nextLng) <= 90 && Math.abs(nextLat) <= 180) {
    nextLat = lng;
    nextLng = lat;
  }

  return {
    lat: Math.round(nextLat * 1e7) / 1e7,
    lng: Math.round(nextLng * 1e7) / 1e7,
  };
}
