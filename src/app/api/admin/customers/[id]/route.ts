import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { data: customer, error: custErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'customer')
    .single();

  if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name_ar, name_en)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, technician:profiles!reviews_technician_id_fkey(full_name)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ ...customer, bookings: bookings ?? [], reviews: reviews ?? [] });
}
