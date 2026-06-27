import type { SiteCurrency } from '@/lib/currency/constants';

export interface SiteSettings {
  id: string;
  currency: SiteCurrency;
  updated_at: string;
}
