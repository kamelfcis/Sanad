'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useCallback } from 'react';
import { getAdminDictionary } from './dictionaries';
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminNumber,
  formatAdminShortDate,
  formatAdminTime,
} from './format';
import { useSiteCurrency } from '@/hooks/use-site-settings';
import { DEFAULT_CURRENCY } from '@/lib/currency/constants';
import { useAdminLocaleStore } from './store';
import type { AdminDirection, AdminLocale, AdminTranslator } from './types';

const ROOT_LANG = 'ar';
const ROOT_DIR = 'rtl';

function lookup(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

function createTranslator(locale: AdminLocale): AdminTranslator {
  const dict = getAdminDictionary(locale);
  return (key, params) => {
    const value = lookup(dict as unknown as Record<string, unknown>, key);
    if (value === undefined) {
      if (process.env.NODE_ENV === 'development') return key;
      return key;
    }
    return interpolate(value, params);
  };
}

interface AdminI18nContextValue {
  locale: AdminLocale;
  dir: AdminDirection;
  t: AdminTranslator;
  setLocale: (locale: AdminLocale) => void;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatShortDate: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useAdminLocaleStore((s) => s.locale);
  const dir = useAdminLocaleStore((s) => s.dir);
  const hydrated = useAdminLocaleStore((s) => s.hydrated);
  const hydrate = useAdminLocaleStore((s) => s.hydrate);
  const setLocale = useAdminLocaleStore((s) => s.setLocale);
  const { data: siteCurrency = DEFAULT_CURRENCY } = useSiteCurrency();

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dir;
    return () => {
      html.lang = ROOT_LANG;
      html.dir = ROOT_DIR;
    };
  }, [locale, dir, hydrated]);

  const t = useMemo(() => createTranslator(locale), [locale]);

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatAdminDate(locale, date, options),
    [locale],
  );
  const formatTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatAdminTime(locale, date, options),
    [locale],
  );
  const formatDateTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatAdminDateTime(locale, date, options),
    [locale],
  );
  const formatShortDate = useCallback(
    (date: Date | string | number) => formatAdminShortDate(locale, date),
    [locale],
  );
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => formatAdminNumber(locale, value, options),
    [locale],
  );
  const formatCurrency = useCallback(
    (value: number, currency?: string) =>
      formatAdminCurrency(locale, value, currency ?? siteCurrency),
    [locale, siteCurrency],
  );

  const value = useMemo(
    () => ({
      locale,
      dir,
      t,
      setLocale,
      formatDate,
      formatTime,
      formatDateTime,
      formatShortDate,
      formatNumber,
      formatCurrency,
    }),
    [locale, dir, t, setLocale, formatDate, formatTime, formatDateTime, formatShortDate, formatNumber, formatCurrency],
  );

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminT() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) {
    throw new Error('useAdminT must be used within AdminI18nProvider');
  }
  return ctx;
}

export function useAdminI18nOptional() {
  return useContext(AdminI18nContext);
}
