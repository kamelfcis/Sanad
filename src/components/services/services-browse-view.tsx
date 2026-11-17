'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Map, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { useBrowseTechnicians } from '@/hooks/use-browse-technicians';
import { ServicesBrowseFilters, type ServicesBrowseFiltersState } from '@/components/services/services-browse-filters';
import { TechnicianBrowseCard } from '@/components/services/technician-browse-card';
import { TECHNICIAN_SPECIALTIES } from '@/lib/constants/technician-registration';
import type { BrowseTechniciansResponse } from '@/types/technician-browse';

const DEFAULT_FILTERS: ServicesBrowseFiltersState = {
  specialty: null,
  providerRole: null,
  contractorKind: null,
  capacityTier: null,
  teamSize: null,
  governorate: null,
  sort: 'rating',
  maxPrice: 500,
  availableOnly: false,
};

type ServicesBrowseViewProps = {
  initialBrowse?: BrowseTechniciansResponse;
};

export function ServicesBrowseView({ initialBrowse }: ServicesBrowseViewProps) {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('providerRole');
  const initialSpecialty = searchParams.get('specialty');
  const knownSpecialty = TECHNICIAN_SPECIALTIES.some((item) => item.value === initialSpecialty);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ServicesBrowseFiltersState>({
    ...DEFAULT_FILTERS,
    providerRole: initialRole === 'technician' || initialRole === 'contractor' ? initialRole : null,
    specialty: knownSpecialty ? initialSpecialty : null,
  });

  const queryFilters = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      specialty: filters.specialty ?? undefined,
      providerRole: filters.providerRole ?? undefined,
      contractorKind: filters.contractorKind ?? undefined,
      capacityTier: filters.providerRole === 'contractor' ? filters.capacityTier ?? undefined : undefined,
      teamSize: filters.providerRole === 'contractor' ? filters.teamSize ?? undefined : undefined,
      governorate: filters.governorate ?? undefined,
      sort: filters.sort,
      maxPrice: filters.maxPrice,
      availableOnly: filters.availableOnly || undefined,
      limit: 24,
    }),
    [filters, searchQuery],
  );

  const { data, isLoading, error, refetch } = useBrowseTechnicians(queryFilters, initialBrowse);

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
          <label htmlFor="services-search" className="sr-only">
            بحث عن صنايعي
          </label>
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <Input
            id="services-search"
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
          type="button"
          variant="outline"
          disabled
          className="gap-2 self-start sm:self-auto"
          title="قريباً"
        >
          <Map className="h-4 w-4" />
          شوف على الخريطة
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
