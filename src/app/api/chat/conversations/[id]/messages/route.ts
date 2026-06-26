import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import {
  conversationIdSchema,
  listMessagesQuerySchema,
  sendMessageSchema,
} from '@/lib/validations/messages';
import { notifyChatMessage } from '@/lib/notifications/events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = conversationIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }
  const { id: conversationId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const queryParsed = listMessagesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!queryParsed.success) {
    return NextResponse.json({ error: queryParsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { limit, before } = queryParsed.data;

  let query = supabase
    .from('chat_messages')
    .select(`
      *,
      sender:profiles!sender_id(full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).reverse());
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = conversationIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }
  const { id: conversationId } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, sendMessageSchema);
  if ('response' in parsed) return parsed.response;

  const { message, file_url, file_type } = parsed.data;

  const { data: conversation } = await supabase
    .from('chat_conversations')
    .select('booking_id')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('customer_id, technician_id')
    .eq('id', conversation.booking_id)
    .single();

  if (!booking || (booking.customer_id !== auth.user.id && booking.technician_id !== auth.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: msg, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: auth.user.id,
      message: message?.trim() || null,
      file_url: file_url || null,
      file_type: file_type || null,
    })
    .select('*, sender:profiles!sender_id(full_name, avatar_url)')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase
    .from('chat_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  const recipientId =
    booking.customer_id === auth.user.id ? booking.technician_id : booking.customer_id;

  if (recipientId) {
    const senderName =
      (msg.sender as { full_name?: string | null } | null)?.full_name ?? 'مستخدم';
    const preview = message?.trim() || (file_url ? 'مرفق' : 'رسالة جديدة');
    await notifyChatMessage(recipientId, senderName, conversationId, preview);
  }

  return NextResponse.json(msg, { status: 201 });
}
