const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Reverse geocode coordinates to a human-readable address (Nominatim / OSM). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lng),
      'accept-language': 'ar,en',
    });
    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: { 'Accept-Language': 'ar,en' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

/** Search addresses and return matching coordinates (Nominatim / OSM). */
export async function searchAddress(
  query: string,
  limit = 5,
): Promise<Array<{ lat: number; lng: number; address: string }>> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  try {
    const params = new URLSearchParams({
      format: 'json',
      q: trimmed,
      countrycodes: 'eg',
      limit: String(limit),
      'accept-language': 'ar,en',
    });
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'Accept-Language': 'ar,en' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimResult[];
    return data.map((item) => ({
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      address: item.display_name,
    }));
  } catch {
    return [];
  }
}
