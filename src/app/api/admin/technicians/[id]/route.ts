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
    return NextResponse.json({ error: 'Invalid technician ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { data: technician, error: techErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'technician')
    .single();

  if (techErr) return NextResponse.json({ error: techErr.message }, { status: 500 });
  if (!technician) return NextResponse.json({ error: 'Technician not found' }, { status: 404 });

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name_ar, name_en), customer:profiles!bookings_customer_id_fkey(full_name, phone)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    ...technician,
    bookings: bookings ?? [],
    reviews: reviews ?? [],
  });
}
