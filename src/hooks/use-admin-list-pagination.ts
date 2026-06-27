'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  DEFAULT_ADMIN_PAGE_SIZE,
  parseAdminPage,
  parseAdminPageSize,
  type AdminPageSize,
} from '@/lib/admin/pagination';

export function useAdminListPagination() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(() => parseAdminPage(searchParams.get('page')), [searchParams]);
  const limit = useMemo(() => parseAdminPageSize(searchParams.get('limit')), [searchParams]);

  const setParams = useCallback(
    (updates: { page?: number; limit?: AdminPageSize }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = updates.page ?? page;
      const nextLimit = updates.limit ?? limit;

      if (nextPage <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(nextPage));
      }

      if (nextLimit === DEFAULT_ADMIN_PAGE_SIZE) {
        params.delete('limit');
      } else {
        params.set('limit', String(nextLimit));
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, page, limit],
  );

  const setPage = useCallback((nextPage: number) => setParams({ page: nextPage }), [setParams]);

  const setLimit = useCallback(
    (nextLimit: AdminPageSize) => setParams({ page: 1, limit: nextLimit }),
    [setParams],
  );

  const resetPage = useCallback(() => setParams({ page: 1 }), [setParams]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    resetPage,
    pageSizeOptions: ADMIN_PAGE_SIZE_OPTIONS,
  };
}
