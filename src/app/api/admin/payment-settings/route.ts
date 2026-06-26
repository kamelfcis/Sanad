import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { updatePaymentSettingsSchema } from '@/lib/validations/payments';

const PAYMENT_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('id', PAYMENT_SETTINGS_ID)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, updatePaymentSettingsSchema);
  if ('response' in parsed) return parsed.response;

  const { data, error } = await supabase
    .from('payment_settings')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', PAYMENT_SETTINGS_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'payment_settings_updated',
    entity_type: 'payment_settings',
    entity_id: PAYMENT_SETTINGS_ID,
    metadata: parsed.data,
  });

  return NextResponse.json(data);
}
