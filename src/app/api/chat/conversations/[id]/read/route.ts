import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { conversationIdSchema } from '@/lib/validations/messages';

export async function PUT(
  _request: NextRequest,
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single();

  const column = profile?.role === 'technician' ? 'technician_last_read_at' : 'customer_last_read_at';

  const { error } = await supabase
    .from('chat_conversations')
    .update({ [column]: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
