import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { updateSiteSettingsSchema } from '@/lib/validations/site-settings';
import { SITE_SETTINGS_ID } from '@/lib/currency/constants';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', SITE_SETTINGS_ID)
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

  const parsed = await parseJsonBody(request, updateSiteSettingsSchema);
  if ('response' in parsed) return parsed.response;

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SITE_SETTINGS_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: auth.user.id,
    action: 'site_settings_updated',
    entity_type: 'site_settings',
    entity_id: SITE_SETTINGS_ID,
    metadata: parsed.data,
  });

  revalidatePath('/api/site-settings');

  return NextResponse.json(data);
}
