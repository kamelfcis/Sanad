'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Map, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { useBrowseTechnicians } from '@/hooks/use-browse-technicians';
import { useUserLocation } from '@/hooks/use-user-location';
import { ServicesBrowseFilters, type ServicesBrowseFiltersState } from '@/components/services/services-browse-filters';
import { TechnicianBrowseCard } from '@/components/services/technician-browse-card';

const DEFAULT_FILTERS: ServicesBrowseFiltersState = {
  specialty: null,
  governorate: null,
  sort: 'rating',
  maxPrice: 500,
  availableOnly: false,
};

export function ServicesBrowseView() {
  const searchParams = useSearchParams();
  const urlSpecialty = searchParams.get('specialty');
  const urlGovernorate = searchParams.get('governorate');
  const urlSearch = searchParams.get('q') ?? searchParams.get('search') ?? '';

  const { location } = useUserLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ServicesBrowseFiltersState>(DEFAULT_FILTERS);

  const queryFilters = useMemo(
    () => ({
      search: (searchQuery.trim() || urlSearch.trim()) || undefined,
      specialty: filters.specialty ?? urlSpecialty ?? undefined,
      governorate: filters.governorate ?? urlGovernorate ?? undefined,
      sort: filters.sort,
      maxPrice: filters.maxPrice,
      availableOnly: filters.availableOnly || undefined,
      lat: location.lat,
      lng: location.lng,
      limit: 24,
    }),
    [filters, location.lat, location.lng, searchQuery, urlGovernorate, urlSearch, urlSpecialty],
  );

  const mapHref = useMemo(() => {
    const params = new URLSearchParams();
    const specialty = filters.specialty ?? urlSpecialty;
    const governorate = filters.governorate ?? urlGovernorate;
    const search = searchQuery.trim() || urlSearch.trim();
    if (specialty) params.set('specialty', specialty);
    if (governorate) params.set('governorate', governorate);
    if (filters.sort !== 'rating') params.set('sort', filters.sort);
    if (filters.maxPrice !== 500) params.set('maxPrice', String(filters.maxPrice));
    if (filters.availableOnly) params.set('availableOnly', 'true');
    if (search) params.set('q', search);
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
    return `/services/map?${params.toString()}`;
  }, [filters, location.lat, location.lng, searchQuery, urlGovernorate, urlSearch, urlSpecialty]);

  const { data, isLoading, error, refetch } = useBrowseTechnicians(queryFilters);

  const handleFilterChange = (patch: Partial<ServicesBrowseFiltersState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            دور على الخدمة اللي محتاجها
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-secondary md:text-lg">
            اختار التخصص واختار من بين أفضل الصنايعية في منطقتك.
          </p>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث عن صنايعي أو منطقة..."
            className="h-11 rounded-xl border-border bg-background pr-10"
          />
        </div>
      </div>

      <ServicesBrowseFilters filters={filters} onChange={handleFilterChange} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text-secondary md:text-base">
          {isLoading ? '...' : `${data?.total ?? 0} صنايعي مطابق لبحثك`}
        </p>
        <Button
          asChild
          variant="outline"
          className="gap-2 self-start sm:self-auto"
        >
          <Link href={mapHref}>
            <Map className="h-4 w-4" />
            شوف على الخريطة
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border p-5">
              <div className="mb-4 flex gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <Skeleton className="mb-4 h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState
            title="تعذّر تحميل الصنايعية"
            description={error.message}
            onRetry={() => refetch()}
          />
        </div>
      ) : data?.technicians.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-text-primary">مفيش صنايعي مطابق للبحث</p>
          <p className="mt-2 text-sm text-text-secondary">
            جرّب تغيّر الفلاتر أو{' '}
            <Link href="/auth/register-technician" className="font-medium text-primary hover:underline">
              سجّل كصنايعي
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.technicians.map((technician) => (
            <TechnicianBrowseCard key={technician.id} technician={technician} />
          ))}
        </div>
      )}
    </div>
  );
}
