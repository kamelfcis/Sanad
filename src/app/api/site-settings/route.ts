import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_CURRENCY, SITE_SETTINGS_ID, isSiteCurrency } from '@/lib/currency/constants';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('currency')
    .eq('id', SITE_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ currency: DEFAULT_CURRENCY });
  }

  const currency = data?.currency && isSiteCurrency(data.currency) ? data.currency : DEFAULT_CURRENCY;

  return NextResponse.json(
    { currency },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
