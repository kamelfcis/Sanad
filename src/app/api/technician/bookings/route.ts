import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { bookingStatusSchema } from '@/lib/validations/common';

const technicianBookingsQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const query = parseSearchParams(request.nextUrl.searchParams, technicianBookingsQuerySchema);
  if ('response' in query) return query.response;

  const { status } = query.data;

  let dbQuery = supabase
    .from('bookings')
    .select(`
      *,
      services(name_ar, name_en, slug, price, price_type),
      profiles:profiles!bookings_customer_id_fkey(full_name, avatar_url)
    `)
    .eq('technician_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error } = await dbQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
