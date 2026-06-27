'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAdminListPagination } from '@/hooks/use-admin-list-pagination';

export type AdminServicesListFilters = {
  search: string;
  category_id: string;
  is_active: '' | 'true' | 'false';
  price_type: '' | 'fixed' | 'hourly' | 'estimate';
};

const FILTER_KEYS = ['search', 'category_id', 'is_active', 'price_type'] as const;

export function useAdminServicesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pagination = useAdminListPagination();

  const filters = useMemo<AdminServicesListFilters>(
    () => ({
      search: searchParams.get('search') ?? '',
      category_id: searchParams.get('category_id') ?? '',
      is_active: (searchParams.get('is_active') as AdminServicesListFilters['is_active']) ?? '',
      price_type: (searchParams.get('price_type') as AdminServicesListFilters['price_type']) ?? '',
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (updates: Partial<AdminServicesListFilters>, options?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      const resetPage = options?.resetPage ?? true;

      for (const [key, value] of Object.entries(updates)) {
        if (!FILTER_KEYS.includes(key as (typeof FILTER_KEYS)[number])) continue;
        if (value === '' || value === null || value === undefined) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      if (resetPage) {
        params.delete('page');
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) {
      params.delete(key);
    }
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const activeFilterCount = useMemo(
    () => FILTER_KEYS.filter((key) => Boolean(filters[key])).length,
    [filters],
  );

  return {
    ...pagination,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
  };
}
