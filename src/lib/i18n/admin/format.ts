import type { AdminLocale } from './types';

const LOCALE_MAP: Record<AdminLocale, string> = {
  ar: 'ar-EG',
  en: 'en-US',
};

const CURRENCY = 'SAR';

export function getIntlLocale(locale: AdminLocale): string {
  return LOCALE_MAP[locale];
}

export function formatAdminDate(
  locale: AdminLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(d);
}

export function formatAdminTime(
  locale: AdminLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(d);
}

export function formatAdminDateTime(
  locale: AdminLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(d);
}

export function formatAdminShortDate(
  locale: AdminLocale,
  date: Date | string | number,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatAdminNumber(
  locale: AdminLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatAdminCurrency(
  locale: AdminLocale,
  value: number,
  currency = CURRENCY,
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
