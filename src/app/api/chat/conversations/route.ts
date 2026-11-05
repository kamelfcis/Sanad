import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data, error } = await supabase
    .from('chat_conversations')
    .select(
      `
      id,
      booking_id,
      created_at,
      customer_last_read_at,
      technician_last_read_at,
      last_message:chat_messages(sender_id, created_at, message),
      booking:bookings!booking_id(
        services(name_ar, name_en),
        profiles:profiles!bookings_customer_id_fkey(full_name, avatar_url, phone),
        technician:profiles!bookings_technician_id_fkey(full_name, phone)
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const conversations = (data ?? []).map((row) => {
    const last = Array.isArray(row.last_message) ? row.last_message[0] : row.last_message;
    return { ...row, last_message: last ?? null };
  });

  return NextResponse.json(conversations);
}
