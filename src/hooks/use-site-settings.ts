'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SiteSettings } from '@/types/site-settings';
import type { SiteCurrency } from '@/lib/currency/constants';
import { DEFAULT_CURRENCY } from '@/lib/currency/constants';
import { formatMoney } from '@/lib/currency/format';
import { useAdminI18nOptional } from '@/lib/i18n/admin/context';
import { ADMIN_ERROR_CODES as E } from '@/lib/i18n/admin/types';

const SITE_SETTINGS_QUERY_KEY = ['site-settings'] as const;

async function fetchPublicSiteCurrency(): Promise<SiteCurrency> {
  const res = await fetch('/api/site-settings');
  if (!res.ok) return DEFAULT_CURRENCY;
  const data = await res.json();
  return data.currency ?? DEFAULT_CURRENCY;
}

async function fetchAdminSiteSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/admin/site-settings');
  if (!res.ok) throw new Error(E.FETCH_SITE_SETTINGS_FAILED);
  return res.json();
}

async function updateSiteSettings(data: { currency: SiteCurrency }): Promise<SiteSettings> {
  const res = await fetch('/api/admin/site-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? E.UPDATE_SITE_SETTINGS_FAILED);
  }
  return res.json();
}

export function useSiteCurrency() {
  return useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchPublicSiteCurrency,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSiteSettings() {
  return useQuery({
    queryKey: [...SITE_SETTINGS_QUERY_KEY, 'admin'],
    queryFn: fetchAdminSiteSettings,
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: (data) => {
      qc.setQueryData(SITE_SETTINGS_QUERY_KEY, data.currency);
      qc.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

export function useFormatMoney() {
  const { data: currency = DEFAULT_CURRENCY } = useSiteCurrency();
  const adminI18n = useAdminI18nOptional();
  const locale = adminI18n?.locale ?? 'ar';

  return {
    currency,
    formatMoney: (amount: number) => formatMoney(amount, currency, locale),
    formatMoneyOrEstimate: (price: number | string | null | undefined, estimateLabel = 'حسب المعاينة') => {
      if (price == null || price === '') return estimateLabel;
      const amount = typeof price === 'number' ? price : Number(price);
      return Number.isFinite(amount) ? formatMoney(Math.round(amount), currency, locale) : estimateLabel;
    },
  };
}
