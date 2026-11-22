const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

/**
 * Nominatim viewbox is left,top,right,bottom: west, north, east, south.
 * Covers Cairo through New Cairo (including التجمع الخامس / النرجس) and excludes
 * the separate النرجس neighbourhood in 6th of October (~30.94°E).
 */
const CAIRO_VIEWBOX = '31.00,30.25,31.75,29.90';

const CAIRO_AREA_QUERY = /النرجس|التجمع|القاهرة الجديدة|new cairo|el narges|narges/i;

function nominatimHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Accept-Language': 'ar' };
  // Browsers set User-Agent themselves and reject attempts to override it.
  if (typeof window === 'undefined') {
    headers['User-Agent'] = 'Sanad/1.0 (Egypt booking geocoder)';
  }
  return headers;
}

/** Reverse geocode coordinates to a human-readable address (Nominatim / OSM). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lng),
      'accept-language': 'ar',
    });
    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: nominatimHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

async function nominatimSearch(
  query: string,
  limit: number,
  bounded: boolean,
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    countrycodes: 'eg',
    limit: String(limit),
    viewbox: CAIRO_VIEWBOX,
    'accept-language': 'ar',
  });
  if (bounded) params.set('bounded', '1');

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: nominatimHeaders(),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimResult[];
  return Array.isArray(data) ? data : [];
}

function toPoints(results: NominatimResult[]): Array<{ lat: number; lng: number; address: string; importance: number }> {
  return results.flatMap((item) => {
    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ lat, lng, address: item.display_name, importance: item.importance ?? 0 }];
  });
}

/** Search addresses and return matching coordinates (Nominatim / OSM). */
export async function searchAddress(
  query: string,
  limit = 5,
): Promise<Array<{ lat: number; lng: number; address: string }>> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  try {
    const biasToCairo = CAIRO_AREA_QUERY.test(trimmed);
    let results = await nominatimSearch(trimmed, limit, biasToCairo);

    if (results.length === 0) {
      const primary = trimmed.split(/[،,]/)[0]?.trim() ?? '';
      if (primary.length >= 3 && primary !== trimmed) {
        results = await nominatimSearch(primary, limit, true);
        results.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
      }
    }

    return toPoints(results).map(({ lat, lng, address }) => ({ lat, lng, address }));
  } catch {
    return [];
  }
}
