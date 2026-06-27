export const SITE_SETTINGS_ID = '00000000-0000-0000-0000-000000000002';

export const SUPPORTED_CURRENCIES = [
  'EGP',
  'SAR',
  'AED',
  'USD',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'JOD',
] as const;

export type SiteCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SiteCurrency = 'EGP';

export const CURRENCY_LABELS: Record<SiteCurrency, { ar: string; en: string }> = {
  EGP: { ar: 'جنيه مصري (EGP)', en: 'Egyptian Pound (EGP)' },
  SAR: { ar: 'ريال سعودي (SAR)', en: 'Saudi Riyal (SAR)' },
  AED: { ar: 'درهم إماراتي (AED)', en: 'UAE Dirham (AED)' },
  USD: { ar: 'دولار أمريكي (USD)', en: 'US Dollar (USD)' },
  KWD: { ar: 'دينار كويتي (KWD)', en: 'Kuwaiti Dinar (KWD)' },
  QAR: { ar: 'ريال قطري (QAR)', en: 'Qatari Riyal (QAR)' },
  BHD: { ar: 'دينار بحريني (BHD)', en: 'Bahraini Dinar (BHD)' },
  OMR: { ar: 'ريال عماني (OMR)', en: 'Omani Rial (OMR)' },
  JOD: { ar: 'دينار أردني (JOD)', en: 'Jordanian Dinar (JOD)' },
};

export function isSiteCurrency(value: string): value is SiteCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
