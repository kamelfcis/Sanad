import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody, parseSearchParams } from '@/lib/api/validate';
import { updateTechnicianSkillsSchema } from '@/lib/validations/technicians';
import { emptyQuerySchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, emptyQuerySchema);
  if ('response' in query) return query.response;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data, error } = await supabase
    .from('technician_skills')
    .select('*, services(name_ar, name_en, slug, price, price_type)')
    .eq('technician_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, updateTechnicianSkillsSchema);
  if ('response' in parsed) return parsed.response;

  const { skills } = parsed.data;

  const { error: deleteError } = await supabase
    .from('technician_skills')
    .delete()
    .eq('technician_id', auth.user.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (skills.length > 0) {
    const { error: insertError } = await supabase.from('technician_skills').insert(
      skills.map((s) => ({
        technician_id: auth.user.id,
        service_id: s.service_id,
        price_override: s.price_override ?? null,
      })),
    );

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
