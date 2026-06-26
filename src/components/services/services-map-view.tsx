'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { List, LocateFixed, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { useBrowseTechnicians } from '@/hooks/use-browse-technicians';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  ServicesBrowseFilters,
  type ServicesBrowseFiltersState,
} from '@/components/services/services-browse-filters';
import { TechniciansMap } from '@/components/maps/technicians-map';
import { toTechnicianMapMarkers } from '@/lib/technicians/map-markers';
import { CAIRO_DEFAULT } from '@/lib/geo';

const DEFAULT_FILTERS: ServicesBrowseFiltersState = {
  specialty: null,
  governorate: null,
  sort: 'distance',
  maxPrice: 500,
  availableOnly: false,
};

function buildMapQuery(
  filters: ServicesBrowseFiltersState,
  search: string,
  lat?: number,
  lng?: number,
): string {
  const params = new URLSearchParams();
  if (filters.specialty) params.set('specialty', filters.specialty);
  if (filters.governorate) params.set('governorate', filters.governorate);
  if (filters.sort !== 'distance') params.set('sort', filters.sort);
  if (filters.maxPrice !== 500) params.set('maxPrice', String(filters.maxPrice));
  if (filters.availableOnly) params.set('availableOnly', 'true');
  if (search.trim()) params.set('q', search.trim());
  if (lat != null && lng != null) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function ServicesMapView() {
  const searchParams = useSearchParams();
  const urlSpecialty = searchParams.get('specialty');
  const urlGovernorate = searchParams.get('governorate');
  const urlSearch = searchParams.get('q') ?? searchParams.get('search') ?? '';
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');

  const { location, loading: geoLoading, error: geoError, refresh, isFallback } =
    useUserLocation();

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [filters, setFilters] = useState<ServicesBrowseFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    specialty: urlSpecialty,
    governorate: urlGovernorate,
    sort: 'distance',
  }));

  const userLocation = useMemo(() => {
    if (urlLat && urlLng) {
      const lat = Number.parseFloat(urlLat);
      const lng = Number.parseFloat(urlLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    return location;
  }, [location, urlLat, urlLng]);

  const queryFilters = useMemo(
    () => ({
      search: (searchQuery.trim() || urlSearch.trim()) || undefined,
      specialty: filters.specialty ?? urlSpecialty ?? undefined,
      governorate: filters.governorate ?? urlGovernorate ?? undefined,
      sort: filters.sort,
      maxPrice: filters.maxPrice,
      availableOnly: filters.availableOnly || undefined,
      lat: userLocation.lat,
      lng: userLocation.lng,
      limit: 100,
    }),
    [filters, searchQuery, urlGovernorate, urlSearch, urlSpecialty, userLocation],
  );

  const { data, isLoading, error, refetch } = useBrowseTechnicians(queryFilters);
  const markers = useMemo(
    () => toTechnicianMapMarkers(data?.technicians ?? []),
    [data?.technicians],
  );

  const listHref = `/services${buildMapQuery(filters, searchQuery, userLocation.lat, userLocation.lng)}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            الصنايعية على الخريطة
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-secondary md:text-lg">
            شوف أقرب الصنايعية الموثّقين حواليك واختار اللي يناسبك.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={refresh}>
            <LocateFixed className="h-4 w-4" />
            موقعي
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={listHref}>
              <List className="h-4 w-4" />
              عرض القائمة
            </Link>
          </Button>
        </div>
      </div>

      {geoError && isFallback && (
        <p className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm text-text-secondary">
          {geoError}
        </p>
      )}

      <ServicesBrowseFilters filters={filters} onChange={(patch) => setFilters((c) => ({ ...c, ...patch }))} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text-secondary md:text-base">
          {isLoading || geoLoading
            ? '...'
            : `${markers.length} صنايعي على الخريطة من أصل ${data?.total ?? 0}`}
        </p>
        <div className="relative w-full sm:max-w-sm">
          <Map className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث عن صنايعي أو منطقة..."
            className="h-11 w-full rounded-xl border border-border bg-background px-4 pr-10 text-sm"
          />
        </div>
      </div>

      {isLoading || geoLoading ? (
        <Skeleton className="mt-6 h-[480px] w-full rounded-2xl" />
      ) : error ? (
        <div className="mt-6">
          <ErrorState
            title="تعذّر تحميل الخريطة"
            description={error.message}
            onRetry={() => refetch()}
          />
        </div>
      ) : markers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-text-primary">مفيش صنايعي على الخريطة</p>
          <p className="mt-2 text-sm text-text-secondary">
            جرّب تغيّر الفلاتر أو{' '}
            <Link href="/auth/register-technician" className="font-medium text-primary hover:underline">
              سجّل كصنايعي
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <TechniciansMap
            technicians={markers}
            center={userLocation ?? CAIRO_DEFAULT}
          />
        </div>
      )}
    </div>
  );
}
