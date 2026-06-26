# Phase 12 — Maps & Location Services

## Overview

Phase 12 adds interactive maps across Sanad using **Leaflet** + **react-leaflet** with **OpenStreetMap** tiles. No Google Maps API key is required. Map components are loaded with `next/dynamic` (`ssr: false`) for Next.js compatibility.

## Schema

**Migration:** `supabase/migrations/00020_technician_location.sql`

| Column | Table | Type | Description |
|--------|-------|------|-------------|
| `location_lat` | `technician_profiles` | DECIMAL(10,7) nullable | Technician base latitude |
| `location_lng` | `technician_profiles` | DECIMAL(10,7) nullable | Technician base longitude |

Bookings already had `location_address`, `location_lat`, `location_lng` from Phase 4.

**RLS:** Unchanged — new columns inherit existing `technician_profiles` policies.

## Packages

```json
"leaflet": "^1.x",
"react-leaflet": "^5.x",
"@types/leaflet": "^1.x"
```

## Geo Utilities (`src/lib/geo/`)

| Module | Purpose |
|--------|---------|
| `haversine.ts` | `haversineDistanceKm(lat1, lng1, lat2, lng2)` |
| `centroids.ts` | `EGYPT_GOVERNORATE_CENTROIDS`, `CAIRO_DEFAULT`, `getGovernorateCentroid()` |
| `format-distance.ts` | `formatDistanceKm(km)` — Arabic locale (`ar-EG`) |
| `geocode.ts` | Nominatim reverse/search (OSM, no API key) |
| `leaflet-setup.ts` | Fixes default marker icons in Next.js bundles |

### Distance resolution order

1. User `lat`/`lng` query params + technician `location_lat`/`location_lng` → haversine
2. User coords + technician `governorate` → haversine to governorate centroid
3. No user coords or no tech location → deterministic mock (legacy fallback)

## Map Components (`src/components/maps/`)

| Component | File | Usage |
|-----------|------|-------|
| `MapPicker` | `map-picker.tsx` | Click/drag marker; dynamic import |
| `LocationMap` | `location-map.tsx` | Read-only single marker |
| `TechniciansMap` | `technicians-map.tsx` | Multiple markers + popups |
| `BookingLocationPicker` | `booking-location-picker.tsx` | Map + search + address field |

Leaflet CSS is imported in `src/app/globals.css`.

## Hook

**`src/hooks/use-user-location.ts`**

- Browser `navigator.geolocation.getCurrentPosition`
- Permission state tracking
- Fallback: Cairo (`30.0444, 31.2357`)
- `refresh()` to re-request location

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/services/map` | Public | Verified technicians on map; filters via query params |

Existing routes updated with maps:

| Route | Map |
|-------|-----|
| `/customer/bookings/new` | `BookingLocationPicker` in booking form |
| `/customer/bookings/[id]` | `LocationMap` when lat/lng present |
| `/technician/jobs/[id]` | Customer location map |

## API Changes

**`GET /api/technicians/browse`** — non-breaking additions:

| Query param | Type | Description |
|-------------|------|-------------|
| `lat` | number (-90…90) | User latitude (optional) |
| `lng` | number (-180…180) | User longitude (optional) |

Validated via `browseTechniciansQuerySchema`. Response includes `location_lat`, `location_lng` per technician (resolved coords for map markers).

## User Flows

### Customer booking

```
Booking form → MapPicker (click/drag) → reverse geocode (Nominatim)
           → location_address + location_lat + location_lng
           → POST /api/bookings (unchanged schema)
```

### Services browse

```
/services → "شوف على الخريطة" → /services/map?filters…
         → useUserLocation → browse API with lat/lng
         → TechniciansMap markers sorted by distance
```

### Job detail

```
Customer / technician opens booking → LocationMap if coordinates exist
```

## Architecture

```
┌──────────────────┐     ┌─────────────────────┐
│ useUserLocation  │────▶│ GET /api/technicians│
│ (browser geo)    │     │ /browse?lat&lng     │
└──────────────────┘     └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ haversine +  │  │ governorate  │  │ mock (last   │
            │ tech lat/lng │  │ centroid     │  │ resort)      │
            └──────────────┘  └──────────────┘  └──────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ TechniciansMap / │
                            │ LocationMap /    │
                            │ MapPicker        │
                            └──────────────────┘
                                      │
                                      ▼
                            OpenStreetMap tiles
                            (no env vars required)
```

## Environment Variables

None required for OSM tiles or Nominatim geocoding. Optional future: self-hosted tile server or rate-limited geocode proxy.

## Design

- Arabic RTL labels on map UIs
- Tajawal / Cairo font tokens (`--font-heading`, `--font-arabic`)
- Off-white background (`--background: #fafafa`)
- Primary orange markers and CTAs

## Files Added / Modified

**New**

- `supabase/migrations/00020_technician_location.sql`
- `src/lib/geo/*`
- `src/hooks/use-user-location.ts`
- `src/components/maps/*`
- `src/components/services/services-map-view.tsx`
- `src/app/services/map/page.tsx`
- `docs/PHASE-12.md`

**Modified**

- `src/lib/technicians/browse.ts` — real distance
- `src/app/api/technicians/browse/route.ts` — lat/lng params
- `src/lib/validations/technicians.ts` — Zod for lat/lng
- `src/components/shared/booking-form.tsx` — map picker
- `src/components/services/services-browse-view.tsx` — map link
- `src/app/customer/bookings/[id]/page.tsx` — location map
- `src/app/technician/jobs/[id]/page.tsx` — location map
- `src/app/globals.css` — Leaflet CSS
