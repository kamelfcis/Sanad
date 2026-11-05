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

  const { data: skills } = await supabase
    .from('technician_skills')
    .select('service_id')
    .eq('technician_id', auth.user.id);

  const myServiceIds = skills?.map((s) => s.service_id) ?? [];

  let dbQuery = supabase
    .from('bookings')
    .select(`
      *,
      services(name_ar, name_en, slug, price, price_type),
      profiles!customer_id(full_name, avatar_url)
    `)
    .neq('customer_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (status) {
    if (status === 'pending') {
      dbQuery = dbQuery
        .eq('status', 'pending')
        .in('service_id', myServiceIds.length > 0 ? myServiceIds : ['']);
    } else {
      dbQuery = dbQuery.eq('technician_id', auth.user.id).eq('status', status);
    }
  } else {
    dbQuery = dbQuery.or(
      `technician_id.eq.${auth.user.id},and(status.eq.pending,service_id.in.(${myServiceIds.map(() => '?').join(',')}))`,
      ...myServiceIds,
    );
  }

  const { data, error } = await dbQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
