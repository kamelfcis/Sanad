import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { adminEntityIdSchema } from '@/lib/validations/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
  }
  const { id: bookingId } = idParsed.data;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
    .eq('booking_id', bookingId)
    .eq('is_hidden', false)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}
