import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { listAssignmentsQuerySchema } from '@/lib/validations/assignments';
import { BOOKING_WITH_CUSTOMER_PROFILE_SELECT } from '@/lib/booking/select-fragments';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const query = parseSearchParams(request.nextUrl.searchParams, listAssignmentsQuerySchema);
  if ('response' in query) return query.response;

  const { status } = query.data;

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  let dbQuery = db
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(
        ${BOOKING_WITH_CUSTOMER_PROFILE_SELECT}
      )
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
