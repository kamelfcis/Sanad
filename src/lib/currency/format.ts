import type { SiteCurrency } from './constants';
import { DEFAULT_CURRENCY } from './constants';

const LOCALE_MAP = {
  ar: 'ar-EG',
  en: 'en-US',
} as const;

export type MoneyLocale = keyof typeof LOCALE_MAP;

export function formatMoney(
  amount: number,
  currency: SiteCurrency | string = DEFAULT_CURRENCY,
  locale: MoneyLocale = 'ar',
): string {
  const safeCurrency = currency || DEFAULT_CURRENCY;
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: safeCurrency === 'KWD' || safeCurrency === 'BHD' || safeCurrency === 'OMR' ? 3 : 0,
  }).format(amount);
}

export function formatMoneyCompact(
  amount: number,
  currency: SiteCurrency | string = DEFAULT_CURRENCY,
  locale: MoneyLocale = 'ar',
): string {
  if (!Number.isFinite(amount)) return '—';
  return formatMoney(Math.round(amount), currency, locale);
}
