import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { parseSearchParams } from '@/lib/api/validate';
import { emptyQuerySchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  const { data, error } = await db
    .from('chat_conversations')
    .select(`
      *,
      booking:bookings(
        id,
        status,
        service_id,
        customer_id,
        technician_id,
        services(name_ar, name_en, slug),
        customer:profiles!bookings_customer_id_fkey(full_name, avatar_url)
      ),
      last_message:chat_messages(
        id, message, file_url, file_type, sender_id, created_at
      )
    `)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const scoped =
    data?.filter((conv) => {
      const booking = conv.booking as { customer_id?: string; technician_id?: string } | null;
      return booking?.customer_id === user.id || booking?.technician_id === user.id;
    }) ?? [];

  // Attach only the most recent message as last_message
  const result = scoped.map((conv: Record<string, unknown>) => {
    const messages = conv.last_message as Record<string, unknown>[];
    const lastMsg = messages?.[0] ?? null;
    return { ...conv, last_message: lastMsg };
  });

  return NextResponse.json(result ?? []);
}
