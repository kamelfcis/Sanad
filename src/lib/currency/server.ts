import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_CURRENCY, SITE_SETTINGS_ID, isSiteCurrency } from './constants';
import type { SiteCurrency } from './constants';

async function fetchSiteCurrencyFromDb(): Promise<SiteCurrency> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('currency')
    .eq('id', SITE_SETTINGS_ID)
    .maybeSingle();

  if (error || !data?.currency || !isSiteCurrency(data.currency)) {
    return DEFAULT_CURRENCY;
  }
  return data.currency;
}

export const getSiteCurrency = unstable_cache(
  fetchSiteCurrencyFromDb,
  ['site-currency'],
  { revalidate: 60, tags: ['site-currency'] },
);
